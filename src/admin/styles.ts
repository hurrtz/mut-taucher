import { theme } from 'antd';

const { useToken } = theme;

/** Common style patterns used across admin components. Call inside a component. */
export function useAdminStyles() {
  const { token } = useToken();

  return {
    /** Flex center layout */
    centered: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as const,

    /** Empty state placeholder */
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 256,
      color: token.colorTextQuaternary,
    } as const,

    /** Vertical flex with gap */
    stack: (gap?: number) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: gap ?? token.marginSM,
    }) as const,

    /** Page content wrapper */
    pageContent: {
      maxWidth: 1280,
    } as const,

    /** Section divider (used inside cards) */
    sectionDivider: {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      paddingTop: token.paddingSM,
      marginTop: token.paddingSM,
    } as const,

    /** Muted metadata text (12px secondary) */
    metaText: {
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
    } as const,

    /** Header row: title left, actions right */
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: token.marginLG,
    } as const,

    token,
  };
}
