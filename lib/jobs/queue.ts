/**
 * Background Job Queue System
 * Handles asynchronous tasks with retry logic
 */

import { JobKind, JobStatus } from '@prisma/client';
import { BackgroundJob, JobHandler } from '@/types';
import prisma from '@/lib/database/client';

export class JobQueue {
  private handlers = new Map<JobKind, JobHandler>();
  private isProcessing = false;
  private concurrency: number;
  private processingJobs = new Set<string>();

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  /**
   * Register a job handler
   */
  registerHandler(handler: JobHandler): void {
    this.handlers.set(handler.kind, handler);
  }

  /**
   * Enqueue a new job
   */
  async enqueue(
    kind: JobKind,
    payload: Record<string, any>,
    priority: number = 0
  ): Promise<BackgroundJob> {
    const job = await prisma.job.create({
      data: {
        kind,
        payload,
        status: JobStatus.PENDING,
        attempts: 0,
        maxRetries: 3,
      },
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return job as BackgroundJob;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<BackgroundJob | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    return job as BackgroundJob | null;
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, progress: number): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        result: { progress },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Start processing jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.isProcessing) {
      try {
        // Check if we can process more jobs
        if (this.processingJobs.size >= this.concurrency) {
          await this.sleep(1000);
          continue;
        }

        // Get next pending job
        const job = await this.getNextJob();

        if (!job) {
          // No jobs to process
          await this.sleep(2000);
          continue;
        }

        // Process job (don't await - run concurrently)
        this.processJob(job).catch(error => {
          console.error(`Error processing job ${job.id}:`, error);
        });

      } catch (error) {
        console.error('Error in job queue:', error);
        await this.sleep(5000);
      }
    }
  }

  /**
   * Stop processing jobs
   */
  stopProcessing(): void {
    this.isProcessing = false;
  }

  /**
   * Get next job to process
   */
  private async getNextJob(): Promise<BackgroundJob | null> {
    // Get oldest pending job
    const job = await prisma.job.findFirst({
      where: {
        status: JobStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!job) {
      return null;
    }

    // Mark as processing
    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.PROCESSING,
        updatedAt: new Date(),
      },
    });

    return updated as BackgroundJob;
  }

  /**
   * Process a single job
   */
  private async processJob(job: BackgroundJob): Promise<void> {
    this.processingJobs.add(job.id);

    try {
      const handler = this.handlers.get(job.kind);

      if (!handler) {
        throw new Error(`No handler registered for job kind: ${job.kind}`);
      }

      // Execute job
      const result = await handler.execute(job.payload);

      // Mark as completed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          result,
          updatedAt: new Date(),
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const attempts = job.attempts + 1;

      // Check if we should retry
      const handler = this.handlers.get(job.kind);
      const shouldRetry = handler?.onError
        ? await handler.onError(error as Error, attempts)
        : attempts < job.maxRetries;

      if (shouldRetry && attempts < job.maxRetries) {
        // Retry job
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.RETRYING,
            attempts,
            lastError: errorMessage,
            updatedAt: new Date(),
          },
        });

        // Re-enqueue after delay
        await this.sleep(Math.min(1000 * Math.pow(2, attempts), 30000));

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.PENDING,
          },
        });

      } else {
        // Mark as failed
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            attempts,
            lastError: errorMessage,
            updatedAt: new Date(),
          },
        });
      }
    } finally {
      this.processingJobs.delete(job.id);
    }
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.job.count({ where: { status: JobStatus.PENDING } }),
      prisma.job.count({ where: { status: JobStatus.PROCESSING } }),
      prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
      prisma.job.count({ where: { status: JobStatus.FAILED } }),
    ]);

    return { pending, processing, completed, failed };
  }

  /**
   * Clear completed jobs older than specified days
   */
  async clearOldJobs(days: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.job.deleteMany({
      where: {
        status: JobStatus.COMPLETED,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

// Global job queue instance
let jobQueue: JobQueue | null = null;

/**
 * Get or create job queue instance
 */
export function getJobQueue(): JobQueue {
  if (!jobQueue) {
    const concurrency = parseInt(process.env.JOB_CONCURRENCY || '5');
    jobQueue = new JobQueue(concurrency);
  }

  return jobQueue;
}

/**
 * Initialize job queue with handlers
 */
export function initializeJobQueue(handlers: JobHandler[]): JobQueue {
  const queue = getJobQueue();

  for (const handler of handlers) {
    queue.registerHandler(handler);
  }

  return queue;
}
