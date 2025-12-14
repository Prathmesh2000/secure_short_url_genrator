interface ValidationResult {
    isValid: boolean;
    message: string;
}

class Validation {
    static validateEmail(email: string): ValidationResult {
        // Check if email is required
        if (!email || email.trim().length === 0) {
            return { isValid: false, message: 'Email is required' };
        }
        // Check email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { isValid: false, message: 'Invalid email address' };
        }
        return { isValid: true, message: 'Email is valid' };
    }

    static validatePassword(password: string): ValidationResult {
        // Check if password is required
        if (!password || password.trim().length === 0) {
            return { isValid: false, message: 'Password is required' };
        }
        // Check length: min 8, max 10 characters
        if (password.length < 8 || password.length > 10) {
            return { isValid: false, message: 'Password must be between 8 and 10 characters' };
        }
        // Check at least one letter
        if (!/[a-zA-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one letter' };
        }
        // Check at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one special character' };
        }
        return { isValid: true, message: 'Password is valid' };
    }

    static validateUsername(username: string): ValidationResult {
        // Check if username is required
        if (!username || username.trim().length === 0) {
            return { isValid: false, message: 'Username is required' };
        }
        // Check username format
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            return { isValid: false, message: 'Invalid username' };
        }
        return { isValid: true, message: 'Username is valid' };
    }

    static validateOtp(otp: string): ValidationResult {
        // Check if otp is required
        if (!otp || otp.trim().length === 0) {
            return { isValid: false, message: 'OTP is required' };
        }
        // Check otp length
        if (otp.length !== 6) {
            return { isValid: false, message: 'OTP must be 6 digits' };
        }
        // Check otp format
        if (!/^[0-9]+$/.test(otp)) {
            return { isValid: false, message: 'Invalid OTP' };
        }
        return { isValid: true, message: 'OTP is valid' };
    }
}

export default Validation;