# TherapyJournal Project Todo List

## 1. Authentication System
- [x] Complete Firebase Authentication setup
  - [x] Implement email/password login functionality
  - [x] Implement password reset functionality
  - [x] Add Google popup signin integration
  - [x] Add user registration with email validation
  - [x] Create session persistence using Firebase auth state listener
  - [x] Implement secure logout functionality
  - [x] Set up protected routes with auth middleware
  - [x] Add loading states for auth operations
  - [x] Implement proper error handling for auth failures

## 2. Journal Entry System
- [ ] Create journal entry editor component
  - [ ] Implement rich text editor with basic formatting options
  - [ ] Add journal entry title field
  - [ ] Add save and cancel actions
  - [ ] Implement autosave functionality
  - [ ] Create custom sentiment tags system
    - [ ] Build UI for tag creation and selection
    - [ ] Implement tag CRUD operations
  - [ ] Create custom sentiment sliders
    - [ ] Build slider UI component (0-10 scale)
    - [ ] Allow custom naming of sliders (e.g., "Sadness", "Gratitude")
    - [ ] Allow saving slider values with entries
  - [ ] Set up Firestore database structure for journal entries
  - [ ] Implement client-side encryption for journal entries
    - [ ] Research and select encryption library
    - [ ] Create encryption/decryption utility functions
    - [ ] Ensure entries are encrypted before storage
  - [ ] Create journal entry listing page
    - [ ] Implement infinite scroll or pagination
    - [ ] Add filtering by date
    - [ ] Add filtering by tags
    - [ ] Add sorting options
  - [ ] Add journal entry search functionality
  - [ ] Build calendar view for journal entries

## 3. Therapist Integration
- [ ] Create therapist invitation system
  - [ ] Build UI for generating secret invitation codes
  - [ ] Create form to input therapist name and generate code
  - [ ] Store therapist invitations in Firestore
  - [ ] Implement code expiration functionality
- [ ] Build therapist access control system
  - [ ] Create therapist registration page using invitation code
  - [ ] Set up therapist-specific authentication
  - [ ] Create therapist role and permissions
- [ ] Develop therapist journal view
  - [ ] Build read-only view of patient journal entries
  - [ ] Add chronological sorting and filtering options
  - [ ] Implement entry decryption for authorized therapists
- [ ] Create commenting system for therapists
  - [ ] Build UI for adding comments to journal entries
  - [ ] Implement notifications for new therapist comments
  - [ ] Store comments securely in Firestore
- [ ] Set up therapist dashboard
  - [ ] Show list of patients
  - [ ] Display recent activity
  - [ ] Create summary statistics view

## 4. User Settings
- [ ] Build settings page UI
  - [x] Create form for updating user profile
  - [x] Implement name change functionality
  - [x] Add email change with verification
  - [x] Add password change option
- [x] Implement theme system
  - [x] Create light/dark theme toggle
  - [x] Set up theme persistence using localStorage
  - [x] Build CSS variables for theming
  - [x] Ensure all components respect theme settings
- [ ] Add account management options
  - [ ] Create account deletion functionality
  - [ ] Add data export option
  - [ ] Implement data backup functionality
- [ ] Create therapist management section
  - [ ] Show list of connected therapists
  - [ ] Add ability to revoke therapist access
  - [ ] Show invitation history

## 5. Additional Features (Optional/Future)
- [ ] Implement data visualization for mood trends
- [ ] Add multi-language support (English/Norwegian)
- [ ] Create mobile-responsive design
- [ ] Implement offline mode with sync
- [ ] Add push notifications for reminders
- [ ] Integrate with external APIs for mood analysis 