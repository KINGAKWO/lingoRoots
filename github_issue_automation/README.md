# GitHub Issue Automation for LingoRoots

This folder helps automate creating Sprint 1 GitHub Issues and custom labels using GitHub CLI.

## 🔧 Prerequisites

- [Install GitHub CLI](https://cli.github.com)
- Run `gh auth login` and authenticate with your GitHub account.

## 🚀 Steps

### 1. Create Labels (One-time setup)

```bash
chmod +x create_labels.sh
./create_labels.sh
```

### 2. Create Sprint 1 Issues

```bash
chmod +x create_sprint1_issues.sh
./create_sprint1_issues.sh
```

All issues will be created in `KINGAKWO/lingoRoots` with appropriate labels.
