/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.{ejs,html}"],
  theme: {
    // colors: {
    //   'brandColor': '#076AE1',
    //   'white':'#FFFFFF'
    // },
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 
                  '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 
                  'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', 
                  '"Noto Color Emoji"'],
      }
    },
  },
  plugins: [],
}

