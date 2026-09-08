// Mantine ships pre-compiled CSS, so postcss-preset-mantine and the
// $mantine-breakpoint-* vars below are inert today; they are Mantine's
// documented setup and only start doing work once we write first-party CSS
// that uses Mantine's mixins or breakpoint variables (e.g. CSS modules in a
// later phase). Kept deliberately — not load-bearing yet, cheap to keep.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
}
