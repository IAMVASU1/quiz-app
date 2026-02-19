import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

export default function useAppTheme() {
    return useContext(ThemeContext);
}
