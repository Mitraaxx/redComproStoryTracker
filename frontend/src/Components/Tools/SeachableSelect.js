import React from 'react';
import Select from 'react-select';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  name, 
  placeholder = "Select...", 
  isClearable = true 
}) => {

  const formattedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.name || opt._id, label: opt.name };
    }
    return { value: opt, label: opt };
  });

  const selectedOption = formattedOptions.find(opt => opt.value === value) || null;

  const handleSelectChange = (selectedObject) => {
    const fakeEvent = {
      target: {
        name: name,
        value: selectedObject ? selectedObject.value : "" 
      }
    };
    onChange(fakeEvent);
  };


  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#94a3b8'
      },
      minHeight: '34px',       
      height: '34px',          
      minWidth: '200px',      
      width: '100%',           
      backgroundColor: '#ffffff'
    }),
    
    
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',        
      height: '34px',
    }),
    
    input: (provided) => ({
      ...provided,
      margin: '0px',           
      padding: '0px'
    }),
    
    
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '34px',
    }),
    

    menu: (provided) => ({
      ...provided,
      zIndex: 9999 
    })
  };

  return (
    <Select
      options={formattedOptions}
      value={selectedOption}
      onChange={handleSelectChange}
      placeholder={placeholder}
      isClearable={isClearable} 
      isSearchable={true}        
      styles={customStyles}
      name={name}
      menuPosition="fixed"      
    />
  );
};

export default SearchableSelect;