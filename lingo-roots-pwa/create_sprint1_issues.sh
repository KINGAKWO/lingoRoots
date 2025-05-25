#!/bin/bash

# Ensure REPO variable is set, e.g., export REPO="owner/repository"
# Or, you can hardcode it here if it's always the same:
# REPO="your_github_username/lingo-roots-pwa"

if [ -z "$REPO" ]; then
  echo "Error: REPO environment variable is not set."
  echo "Please set it to your GitHub repository (e.g., export REPO=\"owner/repository\")"
  exit 1
fi

# Create issues
gh issue create --repo "$REPO" --title "Fix Tailwind CSS PostCSS Build Error" \
--body "Resolve the build error related to Tailwind CSS's PostCSS plugin.\n\n**Steps to reproduce:**\n1. Run the dev server.\n2. See error: 'Cannot find module tailwindcss/nesting/index.js'\n\n**Expected outcome:**\n- Dev server runs\n- Styles apply correctly" \
--label "priority: high,type: bug,component: frontend,status: needs investigation"

gh issue create --repo "$REPO" --title "Implement Firestore User Document Creation on Sign-up" \
--body "Enhance the sign-up process to create a Firestore document at users/{uid}.\n\n**Fields:** uid, email, role='learner', createdAt.\n**Acceptance Criteria:**\n- Document is created\n- Errors handled cleanly" \
--label "priority: medium,type: feature,component: backend,status: to do"

gh issue create --repo "$REPO" --title "Develop Unit Tests for Authentication Forms" \
--body "Create tests for:\n- Email/password validation\n- Firebase Auth (mocked)\n- Form submission handling" \
--label "priority: medium,type: test,component: frontend,status: to do"

gh issue create --repo "$REPO" --title "Enhance MainLayout with Responsive Design" \
--body "Update layout to be mobile-first responsive using Tailwind.\n- Header/footer always visible\n- Scrollable content\n- Works from 375px to 1440px" \
--label "priority: low,type: enhancement,component: frontend,status: to do"

gh issue create --repo "$REPO" --title "Integrate User Role into AuthContext" \
--body "Modify AuthContext to include user role fetched from Firestore.\n- Add 'role' to context\n- Handle undefined/missing roles gracefully" \
--label "priority: low,type: enhancement,component: backend,status: to do"

gh issue create --repo "$REPO" --title "Create ProtectedRoute Component for Role-Based Access" \
--body "Create a reusable ProtectedRoute wrapper.\n- Redirect unauthenticated users\n- Support optional requiredRole prop for role-based access" \
--label "priority: low,type: feature,component: frontend,status: to do"

echo "Sprint 1 issues creation script finished."