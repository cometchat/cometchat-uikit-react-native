interface Colors {
  primary: string;
  primaryText: string;
  base: string;
  baseText: string;
  disabled: string;
  elevation?: string;
}

const dark: Colors = {
  primary: '#FFC491',
  primaryText: '#2d2d2d',
  base: '#2d2d2d',
  baseText: '#e6e6e6',
  disabled: '#7c7c7c',
  elevation: '#383838',
};

const light: Colors = {
  primary: '#04997C',
  primaryText: '#FFFFFF',
  base: '#FFFFFF',
  baseText: '#333333',
  disabled: '#C9C9CA',
  elevation: '#555555',
};

export default {
  dark,
  light,
};
