import PDFDocument from 'pdfkit';
import { EnergyAuditData, AuditRecommendation } from '../../../types/energyAudit.js';

// Formatter interfaces
export interface IValueFormatter {
  formatValue(
    value: any,
    type: 'currency' | 'percentage' | 'number' | 'text' | 'auto',
    context?: string
  ): string;
}

export interface ITableFormatter {
  generateTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: any[][]
  ): void;
}

export interface IHeaderFormatter {
  addSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    align?: 'left' | 'center' | 'right',
    startNewPage?: boolean,
    indent?: number
  ): void;
}

export interface IRecommendationFormatter {
  addProductRecommendations(
    doc: PDFKit.PDFDocument,
    recommendation: AuditRecommendation
  ): void;
}

// Calculator interfaces
export interface IEnergyCalculator {
  calculateTotalEnergy(auditData: EnergyAuditData): number;
  calculateEnergyEfficiency(auditData: EnergyAuditData): number;
  getBaselineConsumption(propertyType: string, squareFootage: number): number;
  calculateEnergyUseIntensity(auditData: EnergyAuditData): number;
  getEfficiencyDescription(efficiency: number): string;
}

export interface ISavingsCalculator {
  calculatePotentialSavings(recommendations: AuditRecommendation[]): number;
  generateDefaultSavingsEstimate(recommendations: AuditRecommendation[]): number;
  extractCategoryFromRecommendation(recommendation: AuditRecommendation): string;
  // Extended methods for financial calculations
  setAuditData?(auditData: EnergyAuditData): void;
  estimateSavingsByType?(recommendationType: string, scope: string, squareFootage: number): number;
  generateImplementationCostEstimate?(recommendationType: string, scope: string, squareFootage: number): number;
  calculatePaybackPeriod?(cost: number, annualSavings: number): number;
  generateRecommendation?(type: string, description: string, scope?: string): Partial<AuditRecommendation>;
}

export interface IBulbCalculator {
  normalizeBulbPercentages(auditData: EnergyAuditData): { led: number, cfl: number, incandescent: number };
  estimateBulbPercentagesByProperty(auditData: EnergyAuditData): { led: number, cfl: number, incandescent: number };
  getBulbTypeDescription(bulbPercentages: { led: number, cfl: number, incandescent: number }): string;
}

export interface IHvacCalculator {
  calculateHvacEfficiencyGap(auditData: EnergyAuditData): number;
}

export interface ISummaryCalculator {
  calculateTotalEstimatedSavings(recommendations: AuditRecommendation[]): number;
  calculateTotalActualSavings(recommendations: AuditRecommendation[]): number;
  calculateSavingsAccuracy(totalEstimatedSavings: number, totalActualSavings: number): number | null;
  countImplementedRecommendations(recommendations: AuditRecommendation[]): number;
}

// Chart generator interfaces
export interface IChartGenerator {
  generate(data: any, width: number, height: number): Promise<Buffer>;
}

export interface ISavingsChartGenerator extends IChartGenerator {
  generate(recommendations: AuditRecommendation[], width: number, height: number): Promise<Buffer>;
}

export interface IEnergyBreakdownChartGenerator extends IChartGenerator {
  generate(auditData: EnergyAuditData, width: number, height: number): Promise<Buffer>;
}

export interface IConsumptionChartGenerator extends IChartGenerator {
  generate(auditData: EnergyAuditData, width: number, height: number): Promise<Buffer>;
}

// Section generator interfaces
export interface ISectionGenerator {
  generate(doc: PDFKit.PDFDocument, auditData: EnergyAuditData, recommendations?: AuditRecommendation[]): void;
}

// Composite interfaces for grouped functionality
export interface IFormatters {
  valueFormatter: IValueFormatter;
  tableFormatter: ITableFormatter;
  headerFormatter: IHeaderFormatter;
  recommendationFormatter: IRecommendationFormatter;
}

export interface ICalculators {
  energyCalculator: IEnergyCalculator;
  savingsCalculator: ISavingsCalculator;
  bulbCalculator: IBulbCalculator;
  hvacCalculator: IHvacCalculator;
  summaryCalculator: ISummaryCalculator;
}

export interface IChartGenerators {
  savingsChartGenerator: ISavingsChartGenerator;
  energyBreakdownChartGenerator: IEnergyBreakdownChartGenerator;
  consumptionChartGenerator: IConsumptionChartGenerator;
  // Additional chart generators can be added here
}

export interface ISectionGenerators {
  executiveSummaryGenerator: ISectionGenerator;
  propertyInfoGenerator: ISectionGenerator;
  systemDetailsGenerator: ISectionGenerator;
  energyConsumptionGenerator: ISectionGenerator;
  lightingAssessmentGenerator: ISectionGenerator;
  recommendationsGenerator: ISectionGenerator;
  productRecommendationsGenerator: ISectionGenerator;
  // Additional section generators can be added here
}
