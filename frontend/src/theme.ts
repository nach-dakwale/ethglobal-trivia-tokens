import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'transparent',
        color: 'whiteAlpha.900',
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 8 },
        py: { base: 4, md: 8 },
      },
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
            borderRadius: 'full',
            fontWeight: 'semibold',
            color: 'whiteAlpha.700',
            bg: 'whiteAlpha.50',
            _selected: {
              color: 'white',
              bg: 'purple.500',
            },
            _hover: {
              bg: 'whiteAlpha.100',
              _selected: {
                bg: 'purple.600',
              },
            },
          },
        },
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'purple',
      },
      variants: {
        solid: {
          bgGradient: 'linear(to-r, purple.500, pink.500)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(to-r, purple.600, pink.600)',
          },
          _active: {
            bgGradient: 'linear(to-r, purple.700, pink.700)',
          },
        },
        outline: {
          borderColor: 'whiteAlpha.200',
          color: 'whiteAlpha.900',
          _hover: {
            bg: 'whiteAlpha.50',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'whiteAlpha.900',
      },
    },
    Text: {
      baseStyle: {
        color: 'whiteAlpha.800',
      },
    },
    Stack: {
      defaultProps: {
        spacing: 4,
      },
    },
  },
});

export default theme; 