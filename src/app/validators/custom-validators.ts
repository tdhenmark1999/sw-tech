import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      let url = control.value.trim();
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      try {
        const urlObj = new URL(url);
        
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
          return { url: { message: 'Please enter a valid URL (e.g., api.example.com)' } };
        }
        
        if (urlObj.hostname !== 'localhost' && !urlObj.hostname.includes('.')) {
          return { url: { message: 'URL must include a valid domain (e.g., example.com)' } };
        }
        
        return null;
      } catch (e) {
        return { url: { message: 'Please enter a valid URL (e.g., https://api.example.com or api.example.com)' } };
      }
    };
  }
  
  static alphanumericWithSpaces(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const pattern = /^[a-zA-Z0-9\s\-_]+$/;
      if (!pattern.test(control.value)) {
        return { alphanumeric: { message: 'Only letters, numbers, spaces, hyphens and underscores are allowed' } };
      }
      
      return null;
    };
  }
  
  static minLengthTrimmed(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const trimmedLength = control.value.trim().length;
      if (trimmedLength < minLength) {
        return { minLengthTrimmed: { 
          message: `Must be at least ${minLength} characters (excluding spaces)`,
          requiredLength: minLength,
          actualLength: trimmedLength
        }};
      }
      
      return null;
    };
  }
  
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      if (control.value.trim().length === 0) {
        return { whitespace: { message: 'This field cannot be empty or contain only spaces' } };
      }
      
      return null;
    };
  }
  
  static apiKey(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const pattern = /^[a-zA-Z0-9\-_]+$/;
      if (!pattern.test(control.value)) {
        return { apiKey: { message: 'API key can only contain letters, numbers, hyphens and underscores' } };
      }
      
      if (control.value.length < 3) {
        return { apiKey: { message: 'API key must be at least 3 characters long' } };
      }
      
      return null;
    };
  }
}