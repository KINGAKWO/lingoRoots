#!/bin/bash
gh label create "priority: high" --color FF0000 || true
gh label create "priority: medium" --color FFA500 || true
gh label create "priority: low" --color FFD700 || true

gh label create "type: bug" --color d73a4a || true
gh label create "type: feature" --color 0e8a16 || true
gh label create "type: enhancement" --color a2eeef || true
gh label create "type: test" --color f9d0c4 || true

gh label create "component: frontend" --color 0052cc || true
gh label create "component: backend" --color b60205 || true

gh label create "status: to do" --color e4e669 || true
gh label create "status: in progress" --color fbca04 || true
gh label create "status: needs investigation" --color bfdadc || true
