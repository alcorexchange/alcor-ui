// Simple U256 implementation for WASM compatibility
#[derive(Debug, Clone, Copy, Eq)]
pub struct U256 {
    // Store as 4 u64s (little-endian)
    pub data: [u64; 4],
}

impl U256 {
    pub const MAX: U256 = U256 {
        data: [u64::MAX, u64::MAX, u64::MAX, u64::MAX],
    };
    
    pub const fn zero() -> Self {
        U256 { data: [0, 0, 0, 0] }
    }
    
    pub const fn one() -> Self {
        U256 { data: [1, 0, 0, 0] }
    }
    
    pub fn from(val: u128) -> Self {
        U256 {
            data: [val as u64, (val >> 64) as u64, 0, 0],
        }
    }
    
    pub fn from_dec_str(s: &str) -> Option<Self> {
        let mut result = Self::zero();
        for c in s.chars() {
            if let Some(digit) = c.to_digit(10) {
                result = result.mul_u32(10).add_u32(digit);
            } else {
                return None;
            }
        }
        Some(result)
    }
    
    pub fn as_u128(&self) -> u128 {
        ((self.data[1] as u128) << 64) | (self.data[0] as u128)
    }
    
    pub fn as_u64(&self) -> u64 {
        self.data[0]
    }
    
    pub fn as_u32(&self) -> u32 {
        self.data[0] as u32
    }
    
    fn add_u32(self, rhs: u32) -> Self {
        let mut result = self;
        let (sum, carry) = result.data[0].overflowing_add(rhs as u64);
        result.data[0] = sum;
        if carry {
            for i in 1..4 {
                let (sum, carry) = result.data[i].overflowing_add(1);
                result.data[i] = sum;
                if !carry {
                    break;
                }
            }
        }
        result
    }
    
    fn mul_u32(self, rhs: u32) -> Self {
        let mut result = Self::zero();
        let mut carry = 0u64;
        
        for i in 0..4 {
            let prod = (self.data[i] as u128) * (rhs as u128) + carry as u128;
            result.data[i] = prod as u64;
            carry = (prod >> 64) as u64;
        }
        
        result
    }
    
    pub fn shl(self, shift: u32) -> Self {
        if shift == 0 {
            return self;
        }
        if shift >= 256 {
            return Self::zero();
        }
        
        let word_shift = (shift / 64) as usize;
        let bit_shift = shift % 64;
        
        let mut result = Self::zero();
        
        if bit_shift == 0 {
            for i in word_shift..4 {
                result.data[i] = self.data[i - word_shift];
            }
        } else {
            for i in word_shift..4 {
                if i > word_shift {
                    result.data[i] = (self.data[i - word_shift] << bit_shift) 
                        | (self.data[i - word_shift - 1] >> (64 - bit_shift));
                } else {
                    result.data[i] = self.data[0] << bit_shift;
                }
            }
        }
        
        result
    }
    
    pub fn shr(self, shift: u32) -> Self {
        if shift == 0 {
            return self;
        }
        if shift >= 256 {
            return Self::zero();
        }
        
        let word_shift = (shift / 64) as usize;
        let bit_shift = shift % 64;
        
        let mut result = Self::zero();
        
        if bit_shift == 0 {
            for i in 0..(4 - word_shift) {
                result.data[i] = self.data[i + word_shift];
            }
        } else {
            for i in 0..(4 - word_shift) {
                result.data[i] = self.data[i + word_shift] >> bit_shift;
                if i + word_shift + 1 < 4 {
                    result.data[i] |= self.data[i + word_shift + 1] << (64 - bit_shift);
                }
            }
        }
        
        result
    }
    
    pub fn mul(self, rhs: Self) -> Self {
        let mut result = Self::zero();
        
        for i in 0..4 {
            let mut carry = 0u128;
            for j in 0..(4 - i) {
                let prod = (self.data[i] as u128) * (rhs.data[j] as u128) 
                    + (result.data[i + j] as u128) + carry;
                result.data[i + j] = prod as u64;
                carry = prod >> 64;
            }
        }
        
        result
    }
    
    pub fn div(self, rhs: Self) -> Self {
        if rhs == Self::zero() {
            return Self::MAX; // Return max on division by zero
        }
        
        let (quotient, _) = self.div_rem(rhs);
        quotient
    }
    
    pub fn rem(self, rhs: Self) -> Self {
        if rhs == Self::zero() {
            return Self::zero(); // Return 0 on division by zero
        }
        
        let (_, remainder) = self.div_rem(rhs);
        remainder
    }
    
    fn div_rem(self, divisor: Self) -> (Self, Self) {
        if divisor == Self::zero() {
            return (Self::MAX, Self::zero()); // Return max quotient and 0 remainder
        }

        if self < divisor {
            return (Self::zero(), self);
        }

        let mut quotient = Self::zero();
        let mut remainder = self;

        // Find the most significant bit of divisor
        let mut shift = 0u32;
        let mut temp_divisor = divisor;
        // Limit shift to prevent infinite loop when divisor shifts out to zero
        while shift < 256 {
            let next_divisor = temp_divisor.shl(1);
            // Check for overflow: if next <= current, overflow happened
            // Also stop if next > remainder
            if next_divisor <= temp_divisor || next_divisor > remainder {
                break;
            }
            temp_divisor = next_divisor;
            shift += 1;
        }

        // Perform long division
        loop {
            if remainder >= temp_divisor {
                remainder = remainder.sub(temp_divisor);
                quotient.data[(shift / 64) as usize] |= 1u64 << (shift % 64);
            }

            if shift == 0 {
                break;
            }

            shift -= 1;
            temp_divisor = temp_divisor.shr(1);
        }

        (quotient, remainder)
    }
    
    pub fn sub(self, rhs: Self) -> Self {
        let mut result = Self::zero();
        let mut borrow = false;
        
        for i in 0..4 {
            let (sub1, b1) = self.data[i].overflowing_sub(rhs.data[i]);
            let (sub2, b2) = sub1.overflowing_sub(if borrow { 1 } else { 0 });
            result.data[i] = sub2;
            borrow = b1 || b2;
        }
        
        if borrow {
            // Return 0 on underflow
            return Self::zero();
        }
        
        result
    }
    
    pub fn add(self, rhs: Self) -> Self {
        let mut result = Self::zero();
        let mut carry = false;
        
        for i in 0..4 {
            let (sum1, c1) = self.data[i].overflowing_add(rhs.data[i]);
            let (sum2, c2) = sum1.overflowing_add(if carry { 1 } else { 0 });
            result.data[i] = sum2;
            carry = c1 || c2;
        }
        
        result
    }
}

impl PartialEq<Self> for U256 {
    fn eq(&self, other: &Self) -> bool {
        self.data == other.data
    }
}

impl PartialOrd<Self> for U256 {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for U256 {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        for i in (0..4).rev() {
            match self.data[i].cmp(&other.data[i]) {
                std::cmp::Ordering::Equal => continue,
                other => return other,
            }
        }
        std::cmp::Ordering::Equal
    }
}

impl std::ops::Shl<u32> for U256 {
    type Output = Self;
    fn shl(self, rhs: u32) -> Self::Output {
        self.shl(rhs)
    }
}

impl std::ops::Shr<u32> for U256 {
    type Output = Self;
    fn shr(self, rhs: u32) -> Self::Output {
        self.shr(rhs)
    }
}

impl std::ops::Mul for U256 {
    type Output = Self;
    fn mul(self, rhs: Self) -> Self::Output {
        self.mul(rhs)
    }
}

impl std::ops::Div for U256 {
    type Output = Self;
    fn div(self, rhs: Self) -> Self::Output {
        self.div(rhs)
    }
}

impl std::ops::Rem for U256 {
    type Output = Self;
    fn rem(self, rhs: Self) -> Self::Output {
        self.rem(rhs)
    }
}

impl std::ops::Add for U256 {
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output {
        self.add(rhs)
    }
}

impl std::ops::Sub for U256 {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self::Output {
        self.sub(rhs)
    }
}

impl std::ops::ShrAssign<u32> for U256 {
    fn shr_assign(&mut self, rhs: u32) {
        *self = self.shr(rhs);
    }
}