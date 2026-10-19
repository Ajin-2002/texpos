import React from 'react';
import { getInitials } from '../../utils/helpers';

const Avatar = ({ name, size = 34, className = '' }) => {
  const initials = getInitials(name);
  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
