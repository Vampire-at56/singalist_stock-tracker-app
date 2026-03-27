declare module 'react-select-country-list' {
  type CountryOption = { value: string; label: string };

  type CountryList = {
    getData(): CountryOption[];
  };

  export default function countryList(): CountryList;
}

