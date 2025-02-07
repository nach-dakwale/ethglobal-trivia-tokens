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
        bg: 'gray.900',
        minHeight: '100vh',
        color: 'whiteAlpha.900',
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: '100%',
        px: { base: 4, md: 8 },
        py: { base: 4, md: 8 },
      },
    },
    Card: {
      baseStyle: {
        container: {
          backgroundColor: 'gray.800',
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: 'whiteAlpha.100',
        },
        header: {
          pb: 2,
        },
        body: {
          pt: 2,
        },
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'purple',
      },
      variants: {
        solid: {
          bg: 'purple.500',
          color: 'white',
          _hover: {
            bg: 'purple.600',
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