// theme.js
import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const theme = createTheme({
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.DeleteClass": { color: red[700] },
          "&.Mui-disabled": {
            color: "#8C8C8C",
          },
          color: "#0073C8",
        },
      },
    },
  },
});

export default theme;
