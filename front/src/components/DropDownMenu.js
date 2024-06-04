import React, { useRef, useEffect } from 'react';

const DropdownMenu = ({ show, onClose, children, className, style, isTranslate }) => {
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Les dépendances sont vides pour simuler un comportement de componentDidMount et componentWillUnmount

  if (!show) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`fixed ${isTranslate ? '-translate-x-20' : '-translate-x-full'} bg-opacity-90 bg-gray-900 text-white rounded dropdown-z-index ${className || ''}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default DropdownMenu;
