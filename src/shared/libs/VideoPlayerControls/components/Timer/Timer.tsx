import React, {ReactNode} from 'react';
import {Text} from 'react-native';
import {styles} from './styles';
import {Control} from '../Control';

interface TimerProps {
  toggleTimer: () => void;
  resetControlTimeout: () => void;
  children: ReactNode;
  showControls: boolean;
}

export const Timer = ({
  children,
  toggleTimer,
  resetControlTimeout,
  showControls,
}: TimerProps) => {
  return (
    <Control
      callback={toggleTimer}
      resetControlTimeout={resetControlTimeout}
      style={styles.timer}
      disabled={!showControls}>
      <Text style={styles.timerText}>{children}</Text>
    </Control>
  );
};
