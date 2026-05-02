/**
 * Template Loader Service
 * 
 * Loads resume templates from the file system with caching and validation.
 * Handles template discovery, metadata loading, and template file access.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Template } from '../../domain/models/template.js';
import type { TemplateData, TemplateCategory } from '../../domain/models/template.js';

export type TemplateFilter = {
  category?: TemplateCategory;
  industryFocus?: string;
  isActive?: boolean;
};

export type TemplateSearchResult = {
  templates: Array<Template>;
  total: number;
  filters: TemplateFilter;
};

export type TemplateFileInfo = {
  path: string;
  size: number;
  lastModified: Date;
  exists: boolean;
};

export class TemplateLoader {
  private readonly templatesPath: string;
  private readonly cache = new Map<string, Template>();
  private readonly fileCache = new Map<string, TemplateFileInfo>();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  constructor(templatesPath = 'templates') {
    this.templatesPath = resolve(templatesPath);
    this.validateTemplatesDirectory();
  }

  /**
   * Loads all available templates
   */
  async loadAllTemplates(): Promise<Array<Template>> {
    await this.refreshCacheIfNeeded();
    return Array.from(this.cache.values());
  }

  /**
   * Loads a specific template by ID
   */
  async loadTemplate(templateId: string): Promise<Template | null> {
    await this.refreshCacheIfNeeded();
    return this.cache.get(templateId) || null;
  }

  /**
   * Gets a template by ID (alias for loadTemplate)
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    return this.loadTemplate(templateId);
  }

  /**
   * Lists all available templates
   */
  async listTemplates(): Promise<Array<Template>> {
    return this.loadAllTemplates();
  }

  /**
   * Gets template content for a specific format
   */
  async getTemplateContent(templateId: string, format: 'docx' | 'html' = 'docx'): Promise<Buffer | null> {
    return this.readTemplateFile(templateId, format);
  }

  /**
   * Searches templates with filters
   */
  async searchTemplates(filters: TemplateFilter = {}): Promise<TemplateSearchResult> {
    const allTemplates = await this.loadAllTemplates();
    let filteredTemplates = allTemplates;

    // Apply category filter
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.category === filters.category
      );
    }

    // Apply industry focus filter
    if (filters.industryFocus) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.targetsIndustry(filters.industryFocus!)
      );
    }

    // Apply active filter
    if (filters.isActive !== undefined) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.isActive === filters.isActive
      );
    }

    // Sort by category, then by name
    filteredTemplates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return {
      templates: filteredTemplates,
      total: filteredTemplates.length,
      filters
    };
  }

  /**
   * Gets template file information
   */
  async getTemplateFileInfo(templateId: string, fileType: 'docx' | 'html' | 'css' | 'preview'): Promise<TemplateFileInfo | null> {
    const template = await this.loadTemplate(templateId);
    if (!template) return null;

    const cacheKey = `${templateId}-${fileType}`;
    const cached = this.fileCache.get(cacheKey);
    
    // Check if cache is still valid (1 minute)
    if (cached && Date.now() - cached.lastModified.getTime() < 60000) {
      return cached;
    }

    let filePath: string;
    switch (fileType) {
      case 'docx':
        filePath = template.docxPath;
        break;
      case 'html':
        filePath = template.htmlPath || '';
        break;
      case 'css':
        filePath = template.cssPath || '';
        break;
      case 'preview':
        filePath = template.previewPath || '';
        break;
      default:
        return null;
    }

    if (!filePath) return null;

    const fullPath = resolve(this.templatesPath, filePath);
    const exists = existsSync(fullPath);
    
    let size = 0;
    let lastModified = new Date();
    
    if (exists) {
      const stats = statSync(fullPath);
      size = stats.size;
      lastModified = stats.mtime;
    }

    const fileInfo: TemplateFileInfo = {
      path: fullPath,
      size,
      lastModified,
      exists
    };

    this.fileCache.set(cacheKey, fileInfo);
    return fileInfo;
  }

  /**
   * Reads template file content
   */
  async readTemplateFile(templateId: string, fileType: 'docx' | 'html' | 'css'): Promise<Buffer | null> {
    const fileInfo = await this.getTemplateFileInfo(templateId, fileType);
    if (!fileInfo?.exists) return null;

    try {
      return readFileSync(fileInfo.path);
    } catch (error) {
      console.error(`Failed to read template file ${fileInfo.path}:`, error);
      return null;
    }
  }

  /**
   * Validates template integrity
   */
  async validateTemplate(templateId: string): Promise<{ valid: boolean; errors: Array<string> }> {
    const errors: Array<string> = [];
    
    // Check if template exists
    const template = await this.loadTemplate(templateId);
    if (!template) {
      errors.push(`Template '${templateId}' not found`);
      return { valid: false, errors };
    }

    // Check if DOCX file exists
    const docxInfo = await this.getTemplateFileInfo(templateId, 'docx');
    if (!docxInfo?.exists) {
      errors.push(`DOCX file not found: ${template.docxPath}`);
    }

    // Check if HTML file exists (if specified)
    if (template.htmlPath) {
      const htmlInfo = await this.getTemplateFileInfo(templateId, 'html');
      if (!htmlInfo?.exists) {
        errors.push(`HTML file not found: ${template.htmlPath}`);
      }
    }

    // Check if CSS file exists (if specified)
    if (template.cssPath) {
      const cssInfo = await this.getTemplateFileInfo(templateId, 'css');
      if (!cssInfo?.exists) {
        errors.push(`CSS file not found: ${template.cssPath}`);
      }
    }

    // Check if preview file exists (if specified)
    if (template.previewPath) {
      const previewInfo = await this.getTemplateFileInfo(templateId, 'preview');
      if (!previewInfo?.exists) {
        errors.push(`Preview file not found: ${template.previewPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    byCategory: Record<TemplateCategory, number>;
    byIndustry: Record<string, number>;
    active: number;
    inactive: number;
  }> {
    const templates = await this.loadAllTemplates();
    
    const stats = {
      total: templates.length,
      byCategory: {} as Record<TemplateCategory, number>,
      byIndustry: {} as Record<string, number>,
      active: 0,
      inactive: 0
    };

    // Initialize category counts
    const categories: Array<TemplateCategory> = ['professional', 'modern', 'creative', 'academic', 'technical'];
    categories.forEach(category => {
      stats.byCategory[category] = 0;
    });

    // Count templates
    for (const template of templates) {
      // Count by category
      stats.byCategory[template.category]++;

      // Count by industry focus
      for (const industry of template.industryFocus) {
        stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
      }

      // Count active/inactive
      if (template.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    }

    return stats;
  }

  /**
   * Clears the template cache
   */
  clearCache(): void {
    this.cache.clear();
    this.fileCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Sets cache expiry time in milliseconds
   */
  setCacheExpiry(expiryMs: number): void {
    this.cacheExpiry = expiryMs;
  }

  /**
   * Validates that the templates directory exists and is accessible
   */
  private validateTemplatesDirectory(): void {
    if (!existsSync(this.templatesPath)) {
      throw new Error(`Templates directory not found: ${this.templatesPath}`);
    }

    const stats = statSync(this.templatesPath);
    if (!stats.isDirectory()) {
      throw new Error(`Templates path is not a directory: ${this.templatesPath}`);
    }
  }

  /**
   * Refreshes cache if needed
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheExpiry && this.cache.size > 0) {
      return; // Cache is still valid
    }

    await this.loadTemplatesFromDisk();
    this.lastCacheUpdate = now;
  }

  /**
   * Loads templates from disk and populates cache
   */
  private async loadTemplatesFromDisk(): Promise<void> {
    this.cache.clear();

    try {
      const templateDirs = readdirSync(this.templatesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const dirName of templateDirs) {
        const templatePath = join(this.templatesPath, dirName);
        const metadataPath = join(templatePath, 'metadata.json');

        if (existsSync(metadataPath)) {
          try {
            const template = await this.loadTemplateFromDirectory(dirName, templatePath);
            if (template) {
              this.cache.set(template.id, template);
            }
          } catch (error) {
            console.error(`Failed to load template from ${dirName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load templates from disk:', error);
      throw new Error(`Failed to load templates: ${error}`);
    }
  }

  /**
   * Loads a single template from a directory
   */
  private async loadTemplateFromDirectory(dirName: string, templatePath: string): Promise<Template | null> {
    const metadataPath = join(templatePath, 'metadata.json');
    
    try {
      const metadataContent = readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent) as TemplateData;

      // Validate and normalize paths
      const normalizedMetadata = this.normalizeTemplatePaths(metadata, dirName);

      // Validate template data
      const template = new Template(normalizedMetadata);
      
      return template;
    } catch (error) {
      console.error(`Failed to load template metadata from ${metadataPath}:`, error);
      return null;
    }
  }

  /**
   * Normalizes template file paths relative to template directory
   */
  private normalizeTemplatePaths(metadata: TemplateData, dirName: string): TemplateData {
    const normalizePath = (path: string): string => {
      if (!path) return path;
      // If path is already relative to templates directory, keep it
      if (path.startsWith(dirName + '/')) return path;
      // Otherwise, make it relative to the template directory
      return `${dirName}/${path}`;
    };

    return {
      ...metadata,
      docxPath: normalizePath(metadata.docxPath),
      htmlPath: metadata.htmlPath ? normalizePath(metadata.htmlPath) : undefined,
      cssPath: metadata.cssPath ? normalizePath(metadata.cssPath) : undefined,
      previewPath: metadata.previewPath ? normalizePath(metadata.previewPath) : undefined
    };
  }

  /**
   * Gets available template categories
   */
  async getAvailableCategories(): Promise<Array<TemplateCategory>> {
    const templates = await this.loadAllTemplates();
    const categories = new Set<TemplateCategory>();
    
    for (const template of templates) {
      categories.add(template.category);
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Gets available industry focuses
   */
  async getAvailableIndustries(): Promise<Array<string>> {
    const templates = await this.loadAllTemplates();
    const industries = new Set<string>();
    
    for (const template of templates) {
      for (const industry of template.industryFocus) {
        industries.add(industry);
      }
    }
    
    return Array.from(industries).sort();
  }

  /**
   * Checks if a template exists
   */
  async templateExists(templateId: string): Promise<boolean> {
    await this.refreshCacheIfNeeded();
    return this.cache.has(templateId);
  }

  /**
   * Gets template by category
   */
  async getTemplatesByCategory(category: TemplateCategory): Promise<Array<Template>> {
    const templates = await this.loadAllTemplates();
    return templates.filter(template => template.category === category);
  }

  /**
   * Gets templates by industry focus
   */
  async getTemplatesByIndustry(industry: string): Promise<Array<Template>> {
    const templates = await this.loadAllTemplates();
    return templates.filter(template => template.targetsIndustry(industry));
  }

  /**
   * Gets active templates only
   */
  async getActiveTemplates(): Promise<Array<Template>> {
    const templates = await this.loadAllTemplates();
    return templates.filter(template => template.isActive);
  }
}
