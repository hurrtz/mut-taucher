<?php
/**
 * Shared inline style constants for HTML email templates.
 *
 * HTML email requires inline styles — CSS classes are stripped by most clients.
 * Centralizing values here prevents drift and makes theme changes easy.
 */

// Headings
const STYLE_H2         = 'color: #2dd4bf; margin-top: 0;';
const STYLE_H2_ERROR   = 'color: #cf1322; margin-top: 0;';
const STYLE_H3         = 'color: #334155; margin-bottom: 8px;';

// Alert boxes (border-left accent pattern)
const STYLE_ALERT_INFO    = 'background: #f0fdfa; border-left: 4px solid #2dd4bf; padding: 16px; margin: 16px 0;';
const STYLE_ALERT_WARNING = 'background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;';
const STYLE_ALERT_ERROR   = 'background: #fff1f0; border-left: 4px solid #cf1322; padding: 16px; margin: 16px 0;';
const STYLE_ALERT_NEUTRAL = 'background: #f8fafc; border-left: 4px solid #e2e8f0; padding: 12px 16px; margin: 8px 0;';

// Warning text (inside STYLE_ALERT_WARNING)
const STYLE_WARNING_TEXT = 'margin: 0; font-size: 13px; color: #92400e;';

// Tables
const STYLE_TABLE      = 'border-collapse: collapse; width: 100%;';
const STYLE_TD_LABEL   = 'padding: 4px 8px; color: #64748b;';
const STYLE_TD_VALUE   = 'padding: 4px 8px;';

// Bank details table (slightly different padding)
const STYLE_BANK_TABLE = 'width: 100%; border-collapse: collapse; font-size: 14px;';
const STYLE_BANK_LABEL = 'padding: 4px 0; color: #64748b;';
const STYLE_BANK_VALUE = 'padding: 4px 0; font-weight: 600;';
const STYLE_BANK_BOX   = 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;';

// Content paragraphs inside alert boxes
const STYLE_P_FIRST    = 'margin: 0;';
const STYLE_P_NEXT     = 'margin: 4px 0;';
