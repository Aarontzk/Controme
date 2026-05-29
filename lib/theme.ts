"use client";

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  colors: {
    primary: [
      "var(--ds-primary-100, #e6f4ea)",
      "var(--ds-primary-200, #cde8d6)",
      "var(--ds-primary-300, #9fd2b1)",
      "var(--ds-primary-400, #55ad78)",
      "var(--ds-primary-500, #0e8345)",
      "var(--ds-primary-light, #0e8345)",
      "var(--ds-primary, #004838)",
      "var(--ds-primary-700, #004d3e)",
      "var(--ds-primary-800, #003f31)",
      "var(--ds-primary-900, #003026)"
    ],
    cta: [
      "var(--ds-cta-100, #eef8e8)",
      "var(--ds-cta-200, #ddf1cf)",
      "var(--ds-cta-300, #c4e5aa)",
      "var(--ds-cta-400, #a7d479)",
      "var(--ds-cta-alt, #86b637)",
      "var(--ds-cta, #64b72f)",
      "var(--ds-cta-600, #57a329)",
      "var(--ds-cta-700, #4a8b22)",
      "var(--ds-cta-800, #396d1b)",
      "var(--ds-cta-900, #2a5014)"
    ],
    accent: [
      "var(--ds-secondary-100, #f7f7ff)",
      "var(--ds-secondary-200, #ededfa)",
      "var(--ds-secondary-300, #d5d3f0)",
      "var(--ds-secondary-400, #b8b4e6)",
      "var(--ds-secondary, #8178c8)",
      "var(--ds-secondary, #8178c8)",
      "var(--ds-secondary-600, #675fb0)",
      "var(--ds-secondary-700, #514a91)",
      "var(--ds-secondary-800, #3c366d)",
      "var(--ds-secondary-900, #2a2848)"
    ],
    success: [
      "var(--ds-success-100, #e6f4ea)",
      "var(--ds-success-200, #cde8d6)",
      "var(--ds-success-300, #9fd2b1)",
      "var(--ds-success-400, #55ad78)",
      "var(--ds-success-500, #2f9d5f)",
      "var(--ds-success, #0e8345)",
      "var(--ds-success-700, #0a6d38)",
      "var(--ds-success-800, #07572d)",
      "var(--ds-success-900, #053f22)",
      "var(--ds-success-950, #032818)"
    ],
    info: [
      "var(--ds-info-100, #eef6ff)",
      "var(--ds-info-200, #d9ebff)",
      "var(--ds-info-300, #b7dbff)",
      "var(--ds-info-400, #86c2ff)",
      "var(--ds-info-500, #4fa3f7)",
      "var(--ds-info, #267fdc)",
      "var(--ds-info-700, #1d66b5)",
      "var(--ds-info-800, #174f8c)",
      "var(--ds-info-900, #123a68)",
      "var(--ds-info-950, #0b2340)"
    ],
    warning: [
      "var(--ds-warning-100, #fff7ed)",
      "var(--ds-warning-200, #ffedd5)",
      "var(--ds-warning-300, #fed7aa)",
      "var(--ds-warning-400, #fdba74)",
      "var(--ds-warning-500, #f59e0b)",
      "var(--ds-warning, #d97706)",
      "var(--ds-warning-700, #b45309)",
      "var(--ds-warning-800, #92400e)",
      "var(--ds-warning-900, #78350f)",
      "var(--ds-warning-950, #451a03)"
    ],
    danger: [
      "var(--ds-danger-100, #fee2e2)",
      "var(--ds-danger-200, #fecaca)",
      "var(--ds-danger-300, #fca5a5)",
      "var(--ds-danger-400, #f87171)",
      "var(--ds-danger-500, #ef4444)",
      "var(--ds-danger, #dc2626)",
      "var(--ds-danger-700, #b91c1c)",
      "var(--ds-danger-800, #991b1b)",
      "var(--ds-danger-900, #7f1d1d)",
      "var(--ds-danger-950, #450a0a)"
    ],
    gray: [
      "var(--ds-gray-100, #fafafa)",
      "var(--ds-gray-200, #f7f7ff)",
      "var(--ds-gray-300, #ededfa)",
      "var(--ds-gray-400, #cecece)",
      "var(--ds-gray-500, #71717a)",
      "var(--ds-gray-600, #4f4d66)",
      "var(--ds-gray-700, #2a2848)",
      "var(--ds-gray-800, #1a1830)",
      "var(--ds-gray-900, #0d0b1f)",
      "var(--ds-gray-950, #070611)"
    ]
  },
  primaryColor: "primary",
  primaryShade: { light: 6, dark: 5 },
  fontFamily: "var(--ds-font-family)",
  fontFamilyMonospace:
    "var(--ds-font-mono, 'JetBrains Mono', SFMono-Regular, Consolas, monospace)",
  headings: {
    fontWeight: "700",
    fontFamily: "var(--ds-font-heading)",
    sizes: {
      h1: { lineHeight: "1.2" },
      h2: { lineHeight: "1.25" },
      h3: { lineHeight: "1.3" },
      h4: { lineHeight: "1.35" }
    }
  },
  fontSizes: {
    xs: "var(--ds-font-size-xs)",
    sm: "var(--ds-font-size-sm)",
    md: "var(--ds-font-size-base)",
    lg: "var(--ds-font-size-lg)",
    xl: "var(--ds-font-size-2xl)"
  },
  spacing: {
    xs: "var(--ds-spacing-2)",
    sm: "var(--ds-spacing-3)",
    md: "var(--ds-spacing-4)",
    lg: "var(--ds-spacing-6)",
    xl: "var(--ds-spacing-8)"
  },
  radius: {
    xs: "var(--ds-radius-sm, 4px)",
    sm: "var(--ds-radius, 8px)",
    md: "var(--ds-radius-md, 12px)",
    lg: "var(--ds-radius-lg, 16px)",
    xl: "var(--ds-radius-xl, 999px)"
  },
  shadows: {
    xs: "var(--ds-shadow-sm)",
    sm: "var(--ds-shadow-sm)",
    md: "var(--ds-shadow)",
    lg: "var(--ds-shadow-lg)",
    xl: "var(--ds-shadow-xl)"
  },
  components: {
    Button: {
      defaultProps: {
        radius: "xl"
      },
      styles: {
        root: {
          fontWeight: "600",
          fontSize: "var(--mantine-font-size-sm)",
          transition:
            "transform var(--ds-transition-fast), box-shadow var(--ds-transition-fast), background var(--ds-transition-fast)"
        }
      }
    },
    Input: {
      styles: {
        input: {
          borderRadius: "var(--ds-radius-lg, 16px)",
          borderColor: "var(--ds-border-color, #cecece)",
          fontSize: "var(--mantine-font-size-sm)",
          transition:
            "border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast)"
        }
      }
    },
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "lg"
      },
      styles: {
        root: {
          borderColor: "var(--ds-border-color, #cecece)"
        }
      }
    },
    Paper: {
      styles: {
        root: {
          borderRadius: "var(--ds-radius-md, 12px)",
          backgroundColor: "var(--ds-surface-white, #ffffff)",
          borderColor: "var(--ds-border-color, #cecece)"
        }
      }
    },
    Alert: {
      defaultProps: {
        radius: "md"
      },
      styles: {
        root: {
          borderColor: "var(--ds-border-color, #cecece)"
        }
      }
    },
    Progress: {
      defaultProps: {
        radius: "xl"
      },
      styles: {
        root: {
          backgroundColor: "var(--ds-surface-deep, #ededfa)"
        }
      }
    },
    Modal: {
      styles: {
        header: {
          borderBottom: "1px solid var(--ds-border-color, #cecece)",
          padding: "var(--ds-spacing-4) var(--ds-spacing-6)",
          marginBottom: 0
        },
        title: {
          fontWeight: 600,
          fontSize: "var(--ds-font-size-lg)"
        },
        body: {
          padding: "var(--ds-spacing-6)"
        },
        content: {
          borderRadius: "var(--ds-radius-lg, 16px)",
          boxShadow: "var(--ds-shadow-xl)"
        },
        close: {
          color: "var(--ds-text-muted, #71717a)"
        }
      }
    },
    Popover: {
      styles: {
        dropdown: {
          borderRadius: "var(--ds-radius-md, 12px)",
          boxShadow: "var(--mantine-shadow-lg)",
          border: "1px solid var(--ds-border-color, #cecece)"
        }
      }
    },
    Badge: {
      defaultProps: {
        radius: "xl"
      },
      styles: {
        root: {
          fontSize: "var(--ds-font-size-xs)",
          fontWeight: "600",
          textTransform: "none" as const
        }
      }
    },
    TextInput: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "var(--ds-text-primary, #0d0b1f)",
          marginBottom: "var(--ds-spacing-1)"
        },
        input: {
          fontFamily: "var(--mantine-font-family)"
        }
      }
    },
    NumberInput: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "var(--ds-text-primary, #0d0b1f)",
          marginBottom: "var(--ds-spacing-1)"
        }
      }
    },
    Select: {
      styles: {
        label: {
          fontSize: "var(--mantine-font-size-sm)",
          fontWeight: "600",
          color: "var(--ds-text-primary, #0d0b1f)",
          marginBottom: "var(--ds-spacing-1)"
        }
      }
    },
    Table: {
      styles: {
        table: {
          fontSize: "var(--mantine-font-size-sm)"
        },
        th: {
          fontWeight: "600",
          fontSize: "var(--ds-font-size-xs)",
          color: "var(--ds-text-muted, #71717a)"
        }
      }
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: "500",
          fontSize: "var(--mantine-font-size-sm)",
          borderRadius: "var(--ds-radius, 8px)",
          transition:
            "background var(--ds-transition-fast), color var(--ds-transition-fast)"
        }
      }
    },
    Tooltip: {
      defaultProps: {
        withArrow: true,
        arrowSize: 6
      },
      styles: {
        tooltip: {
          fontSize: "var(--ds-font-size-xs)",
          borderRadius: "var(--mantine-radius-sm)"
        }
      }
    },
    Group: {
      defaultProps: {
        gap: "sm"
      }
    },
    Stack: {
      defaultProps: {
        gap: "md"
      }
    }
  }
});
