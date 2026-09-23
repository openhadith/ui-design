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

    /*
     * --- shape and rhythm
     *
     * Sized to read, not to cram. The comps were drawn at a 12–13px scale that
     * looks right in a static mockup but is genuinely hard to read in a tool
     * someone uses all day, so the base follows the public site instead: the
     * same family, the same 1.7 line-height, one step down from its 16px
     * because a dashboard carries more chrome per screen than an article does.
     *
     * Controls grow with the text — AntD's 32px default control is cramped
     * around 15px type.
     */
    fontSize: 15,
    fontSizeSM: 13,
    fontSizeLG: 17,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 17,
    fontSizeHeading5: 15,
    borderRadius: 8,
    borderRadiusLG: 11,
    borderRadiusSM: 6,
    controlHeight: 38,
    controlHeightSM: 32,
    controlHeightLG: 44,
    lineHeight: 1.7,

    /**
     * The public site's stack, so the two applications read as one product.
     * IBM Plex Sans Arabic covers Latin and Arabic script alike, which matters
     * here: the chrome is Kurdish and the numerals sit inside it.
     */
    fontFamily:
      "var(--font-plex-arabic), 'Noto Sans Arabic', system-ui, sans-serif",

    wireframe: false,
  },

  components: {
    Layout: {
      headerBg: c.bar,
      headerHeight: 60,
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
      itemHeight: 40,
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
      cellPaddingBlock: 11,
      cellPaddingInline: 14,
      footerBg: c.bar,
    },
    Card: {
      headerBg: 'transparent',
      headerFontSize: 14,
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
    Modal: { headerBg: c.raised, contentBg: c.raised, titleFontSize: 17 },
    Drawer: { footerPaddingBlock: 12, footerPaddingInline: 16 },
    Statistic: { titleFontSize: 13, contentFontSize: 26 },
    Descriptions: { labelBg: c.sunken, titleMarginBottom: 8 },
    Segmented: {
      itemSelectedBg: c.raised,
      itemSelectedColor: c.emerald,
      trackBg: c.sunken,
    },
    Progress: { defaultColor: c.emerald, remainingColor: c.line },
    Badge: { textFontSize: 12 },
    Alert: { withDescriptionPadding: '12px 16px' },
  },
};
