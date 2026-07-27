/**
 * AI Controller (HTTP Transport Boundary)
 *
 * Purpose:
 *   Converts HTTP requests into AIService completions and formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { DEFAULT_AI_CONFIG } from './ai.config';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class AIController {
  private readonly aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService ?? new AIService();
  }

  postChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prompt = req.body.prompt ? String(req.body.prompt) : '';
      if (!prompt) {
        throw new AppError('Prompt is required for chat completion', HTTP_STATUS.BAD_REQUEST, true);
      }
      const response = await this.aiService.generateResponse(prompt);
      ApiResponse.success(res, 'AI response generated successfully', response);
    } catch (error) {
      next(error);
    }
  };

  postExplain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { context, target } = req.body;
      if (!context || !target) {
        throw new AppError('Context and target are required for AI explanation', HTTP_STATUS.BAD_REQUEST, true);
      }
      const response = await this.aiService.explain(context, String(target));
      ApiResponse.success(res, 'AI explanation generated successfully', response);
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = {
        provider: DEFAULT_AI_CONFIG.provider,
        modelName: DEFAULT_AI_CONFIG.modelName,
        timeoutMs: DEFAULT_AI_CONFIG.timeoutMs,
        retries: DEFAULT_AI_CONFIG.retries,
        promptVersion: DEFAULT_AI_CONFIG.promptVersion,
        responseVersion: DEFAULT_AI_CONFIG.responseVersion,
        fallbackProvider: DEFAULT_AI_CONFIG.fallbackProvider?.provider || 'none',
      };
      ApiResponse.success(res, 'AI provider status retrieved successfully', status);
    } catch (error) {
      next(error);
    }
  };
}
