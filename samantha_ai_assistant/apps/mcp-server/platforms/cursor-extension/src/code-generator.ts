import * as vscode from 'vscode';
import OpenAI from 'openai';

export interface CodeGenerationRequest {
    prompt: string;
    language?: string;
    context?: string;
    temperature?: number;
}

export interface CodeGenerationResult {
    success: boolean;
    code?: string;
    explanation?: string;
    error?: string;
}

export class CodeGenerator {
    private openai: OpenAI;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('samantha-ai');

        // Initialize OpenAI client
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } else {
            console.warn('OpenAI API key not found. Code generation will be limited.');
        }
    }

    public async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
        try {
            if (!this.openai) {
                return {
                    success: false,
                    error: 'OpenAI API key not configured'
                };
            }

            const model = this.config.get('codeGeneration.model', 'gpt-4');
            const temperature = request.temperature || this.config.get('codeGeneration.temperature', 0.3);

            const prompt = this.buildCodeGenerationPrompt(request);

            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software developer. Generate clean, efficient, and well-documented code based on the user\'s request.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: 2000
            });

            const generatedCode = response.choices[0]?.message?.content;

            if (generatedCode) {
                return {
                    success: true,
                    code: generatedCode,
                    explanation: 'Code generated successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'No code generated'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Code generation failed'
            };
        }
    }

    public async explainCode(code: string, language?: string): Promise<CodeGenerationResult> {
        try {
            if (!this.openai) {
                return {
                    success: false,
                    error: 'OpenAI API key not configured'
                };
            }

            const model = this.config.get('codeGeneration.model', 'gpt-4');

            const prompt = `Please explain the following ${language || 'code'} in detail:

\`\`\`${language || ''}
${code}
\`\`\`

Explain:
1. What the code does
2. How it works
3. Key concepts and patterns used
4. Any potential improvements or considerations`;

            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software developer and teacher. Explain code clearly and comprehensively.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });

            const explanation = response.choices[0]?.message?.content;

            if (explanation) {
                return {
                    success: true,
                    explanation: explanation
                };
            } else {
                return {
                    success: false,
                    error: 'No explanation generated'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Code explanation failed'
            };
        }
    }

    public async refactorCode(code: string, language?: string, improvements?: string): Promise<CodeGenerationResult> {
        try {
            if (!this.openai) {
                return {
                    success: false,
                    error: 'OpenAI API key not configured'
                };
            }

            const model = this.config.get('codeGeneration.model', 'gpt-4');

            const prompt = `Please refactor the following ${language || 'code'} to improve its quality, readability, and maintainability:

\`\`\`${language || ''}
${code}
\`\`\`

${improvements ? `Specific improvements requested: ${improvements}` : ''}

Please provide:
1. The refactored code
2. A brief explanation of the improvements made
3. Any additional recommendations`;

            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software developer specializing in code refactoring and optimization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const result = response.choices[0]?.message?.content;

            if (result) {
                // Try to extract code and explanation
                const codeMatch = result.match(/```[\s\S]*?```/);
                const code = codeMatch ? codeMatch[0].replace(/```/g, '') : result;
                const explanation = result.replace(/```[\s\S]*?```/g, '').trim();

                return {
                    success: true,
                    code: code,
                    explanation: explanation || 'Code refactored successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'No refactored code generated'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Code refactoring failed'
            };
        }
    }

    private buildCodeGenerationPrompt(request: CodeGenerationRequest): string {
        let prompt = `Generate code for the following request: ${request.prompt}`;

        if (request.language) {
            prompt += `\n\nLanguage: ${request.language}`;
        }

        if (request.context) {
            prompt += `\n\nContext:\n${request.context}`;
        }

        prompt += `\n\nPlease provide clean, well-documented code that follows best practices.`;

        return prompt;
    }

    public async getSupportedLanguages(): Promise<string[]> {
        return [
            'javascript', 'typescript', 'python', 'java', 'c#', 'cpp', 'c', 'go',
            'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart', 'r',
            'matlab', 'sql', 'html', 'css', 'scss', 'json', 'yaml', 'xml'
        ];
    }

    public isEnabled(): boolean {
        return this.config.get('codeGeneration.enabled', true) && !!this.openai;
    }
}
