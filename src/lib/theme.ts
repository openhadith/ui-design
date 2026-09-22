import type { ThemeConfig } from 'antd';
import { c } from './tokens';

/**
 * Ant Design theme, mapped onto the studio palette.
 *
 * The point of this file is that AntD should not announce itself. Every colour
 * below comes from `tokens.ts`, which came from the ui-design comps, so a Table
 * or a Modal lands in the same warm paper/emerald world as the hand-built
 * screens rather than AntD's default blue.
 *
 * Only tokens that genuinely differ from AntD's defaults are set; leaving the
 * rest alone keeps us on AntD's own algorithm for derived states (hover, active,
 * disabled), which is more consistent than hand-picking every shade.
 */
export const studioTheme: ThemeConfig = {
  token: {
    // --- brand
    colorPrimary: c.emerald,
    colorInfo: c.blue,
    colorSuccess: c.emerald,
    colorWarning: c.gold,
    colorError: c.rust,
    colorLink: c.emerald,
    colorLinkHover: c.emeraldDeep,

    // Status surfaces. Left to AntD these are derived algorithmically from the
    // brand colours above and come out slate-blue and grey-green — close, but
    // visibly off-palette in every Alert and status Tag. Pinning them to the
    // comps' soft tints keeps those components in the same family.
    colorSuccessBg: c.emeraldTint,
    colorSuccessBorder: '#cfe3d7',
    colorInfoBg: c.blueSoft,
    colorInfoBorder: '#d6dfeb',
    colorWarningBg: c.goldSoft,
    colorWarningBorder: '#ecdcb3',
    colorErrorBg: c.rustSoft,
    colorErrorBorder: '#e8cdc5',

    // --- surfaces
    colorBgLayout: c.page,
    colorBgContainer: c.raised,
    colorBgElevated: c.raised,
    colorBgSpotlight: c.inkStrong,

    // --- ink
    colorText: c.ink,
    colorTextSecondary: c.inkMuted,
    colorTextTertiary: c.inkFaint,
    colorTextQuaternary: c.inkPale,
    colorTextHeading: c.inkStrong,

    // --- hairlines
    colorBorder: c.lineNav,
    colorBorderSecondary: c.lineSoft,
    colorSplit: c.lineSoft,

    // --- shape and rhythm
    // The comps run a dense 12–13px scale; AntD's 14px default makes every
    // table a row taller and loses one screenful of the queue.
    fontSize: 13,
    fontSizeSM: 11.5,
    fontSizeLG: 15,
    fontSizeHeading1: 24,
    fontSizeHeading2: 19,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeHeading5: 13,
    borderRadius: 8,
    borderRadiusLG: 11,
    borderRadiusSM: 6,
    controlHeight: 32,
    controlHeightSM: 27,
    lineHeight: 1.7,

    /**
     * Outfit carries no Arabic script, so it is first only for Latin text and
     * numerals; the browser falls back per glyph to Plex Arabic for Kurdish.
     * Both variables are declared on the studio root in layout.tsx.
     */
    fontFamily:
      "var(--font-outfit), var(--font-plex-arabic), 'Noto Sans Arabic', system-ui, sans-serif",

    wireframe: false,
  },

  components: {
    Layout: {
      headerBg: c.bar,
      headerHeight: 54,
      headerPadding: '0 16px',
      siderBg: c.nav,
      bodyBg: c.page,
      footerBg: c.bar,
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: c.emeraldSoft,
      itemSelectedColor: c.emerald,
      itemColor: c.inkMuted,
      itemHoverBg: c.sunken,
      itemHeight: 34,
      itemMarginInline: 8,
      iconSize: 14,
      collapsedIconSize: 15,
    },
    Table: {
      headerBg: c.bar,
      headerColor: c.inkDim,
      headerSplitColor: c.lineSoft,
      rowHoverBg: c.sunken,
      rowSelectedBg: c.emeraldSoft,
      rowSelectedHoverBg: c.emeraldTint,
      borderColor: c.lineSoft,
      cellPaddingBlock: 9,
      cellPaddingInline: 12,
      footerBg: c.bar,
    },
    Card: {
      headerBg: 'transparent',
      headerFontSize: 12.5,
      colorBorderSecondary: c.lineCard,
      paddingLG: 16,
    },
    Tabs: {
      itemColor: c.inkBody,
      itemSelectedColor: c.emerald,
      itemHoverColor: c.emeraldDeep,
      inkBarColor: c.emerald,
      horizontalMargin: '0 0 12px 0',
    },
    Tag: {
      defaultBg: c.sunken,
      defaultColor: c.inkMuted,
      borderRadiusSM: 6,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      fontWeight: 600,
    },
    Input: { activeShadow: `0 0 0 2px ${c.emerald}1f` },
    Select: { optionSelectedBg: c.emeraldSoft },
    Modal: { headerBg: c.raised, contentBg: c.raised, titleFontSize: 15 },
    Drawer: { footerPaddingBlock: 12, footerPaddingInline: 16 },
    Statistic: { titleFontSize: 11.5, contentFontSize: 24 },
    Descriptions: { labelBg: c.sunken, titleMarginBottom: 8 },
    Segmented: {
      itemSelectedBg: c.raised,
      itemSelectedColor: c.emerald,
      trackBg: c.sunken,
    },
    Progress: { defaultColor: c.emerald, remainingColor: c.line },
    Badge: { textFontSize: 10.5 },
    Alert: { withDescriptionPadding: '12px 16px' },
  },
};
