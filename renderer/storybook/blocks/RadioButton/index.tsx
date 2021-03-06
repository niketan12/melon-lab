import React, { StatelessComponent } from 'react';

import styles from './styles.css';

export interface RadioButtonProps {
  defaultChecked?: boolean;
  disabled?: boolean;
  name: string;
  handleOnChange?: () => void;
  text: string;
  value: string;
}

const RadioButton: StatelessComponent<RadioButtonProps> = ({
  defaultChecked,
  disabled,
  name,
  handleOnChange,
  text,
  value,
}) => (
  <label className="radio-button">
    <style jsx>{styles}</style>
    <input
      className="radio-button__input"
      type="radio"
      name={name}
      value={value}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={handleOnChange}
    />
    <span className="radio-button__checkmark" />
    <span className="radio-button__text">{text}</span>
  </label>
);

export default RadioButton;
