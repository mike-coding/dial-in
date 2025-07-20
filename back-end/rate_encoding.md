# Rate Pattern Encoding System

## Overview

This encoding system allows users to specify complex recurring schedules for task/event generation. The format follows a structured pattern that supports daily, weekly, monthly, and yearly recurrence with optional month and time constraints.

---

## General Format

Each recurrence rule is composed of:
- `FREQUENCY`: A letter code indicating the recurrence type.
- `PATTERN`: Specific scheduling details (varies by frequency).
- `MONTHS`: Optional filter for which months the rule applies.
- `TIME`: Optional time of day for the task.

---

## 1. FREQUENCY Types

| Code | Type                 | Description                      |
|------|----------------------|----------------------------------|
| d    | Daily                | Every N days                     |
| w    | Weekly               | Specific weekdays                |
| m    | Monthly (dates)      | Specific dates of the month      |
| mw   | Monthly (weekdays)   | Specific weekday occurrences     |
| y    | Yearly               | Specific month-date pairs        |

---

## 2. PATTERN Specifications

### **Daily (`d`)**
**Format:** `d#[interval]`  
- `interval`: Number of days between occurrences

**Examples:**
- `d#1` → Every day  
- `d#2` → Every other day  
- `d#7` → Every 7 days  

---

### **Weekly (`w`)**
**Format:** `w#[weekdays]`  
- `weekdays`: Concatenated weekday numbers (no separators)  
- Weekday codes: `1=Sunday`, ..., `7=Saturday`

**Examples:**
- `w#1` → Every Sunday  
- `w#35` → Every Tuesday and Thursday  
- `w#1234567` → Every day of the week  

---

### **Monthly – Specific Dates (`m`)**
**Format:** `m#[dates]`  
- `dates`: Comma-separated list of dates (1–31)

**Examples:**
- `m#15` → 15th of every month  
- `m#1,15` → 1st and 15th of every month  

---

### **Monthly – Weekday Occurrences (`mw`)**
**Format:** `mw#[occurrence-weekday],[...]`  
- `occurrence`: `1`=1st, `2`=2nd, `3`=3rd, `4`=4th, `L`=Last  
- `weekday`: 1–7 (Sunday–Saturday)  
- Hyphen separates occurrence and weekday

**Examples:**
- `mw#2-4` → 2nd Wednesday of every month  
- `mw#L-6` → Last Friday of every month  
- `mw#1-2,3-6` → 1st Monday and 3rd Friday  

---

### **Yearly (`y`)**
**Format:** `y#[month-date],[...]`  
- `month`: 1–12  
- `date`: 1–31  
- Hyphen separates month and date

**Examples:**
- `y#12-25` → December 25th  
- `y#1-1,7-4` → New Year's Day and Independence Day  

---

## 3. MONTHS Filter (Optional)

**Format:** `M#[month1,month2,...]`  
- Comma-separated month numbers (1–12)
- Empty = every month

**Examples:**
- `M#1,2,3,...,12` → All months  
- `M#6,7,8` → Summer  
- `M#9,10,11,12,1,2,3,4,5` → School year  

---

## 4. TIME Component (Optional)

**Format:** `T#HH:MM` (24-hour format)

**Examples:**
- `T#09:00` → 9:00 AM  
- `T#18:30` → 6:30 PM  

Used to indicate when during the day a recurring task should occur.

---

## 5. Combining Multiple Rules

To support complex recurrence schedules, multiple rules can be combined using semicolons (`;`).

**Example:**
w#2M#1,2,3; m#15M#1,2,3
→ Occurs every Monday **and** on the 15th of each month, during Jan–Mar.

**Note:** Each rule in the group is evaluated independently.

---

## Complete Examples

| Rule                             | Description                                 |
|----------------------------------|---------------------------------------------|
| `w#1M#1,2,3`                     | Every Sunday in Jan–Mar                     |
| `d#1M#6,7,8T#07:30`             | Daily at 7:30 AM in summer                  |
| `mw#L-6M#12,1,2`                | Last Friday of winter months                |
| `y#12-25M#12T#00:00`           | Christmas Day at midnight                   |
| `w#2M#1,2,3; m#15M#1,2,3`      | Every Monday **and** the 15th in Jan–Mar    |

---

## Validation Rules

- Frequency code must be one of: `d`, `w`, `m`, `mw`, `y`
- Weekday numbers: 1–7
- Month numbers: 1–12
- Date numbers: 1–31
- Occurrence codes: `1–4`, or `L`
- Lists must not contain spaces
- Patterns must match frequency type
- Invalid dates (e.g., Feb 30) are skipped silently
- TIME must be in HH:MM format (00:00 to 23:59)
- Multiple rules separated by semicolon + space ('; ')

---

## Notes
- This system is primarily intended for internal use. End-users do not interact with these codes directly.
- MVP version assumes invalid date rules are silently skipped.
- Time and multi-rule combinations are supported but optional.

---

## Edge Cases

- `m#29,30,31M#2` → Only creates task on Feb 29th in leap years
