#!/bin/bash
# Deploy ONLY analysis HTML files without rebuilding frontend
# Safe to run while study is live
# Usage: ./scripts/deploy-analysis-only.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "=== Step 1: Export notebooks to HTML ==="
source venv/bin/activate
python3 -c "
import nbformat
from nbconvert import HTMLExporter
import os

os.makedirs('frontend/public/results', exist_ok=True)

# Export Phase 1 notebook
with open('analysis/phase1_descriptive_statistics.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
html_exporter = HTMLExporter()
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase1_descriptive_statistics.html', 'w') as f:
    f.write(body)
print('  - phase1_descriptive_statistics.html exported')

# Export Phase 2 notebook
with open('analysis/phase2_chi_square_analysis.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase2_chi_square_analysis.html', 'w') as f:
    f.write(body)
print('  - phase2_chi_square_analysis.html exported')

# Export Phase 3 notebook
with open('analysis/phase3_logistic_regression.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase3_logistic_regression.html', 'w') as f:
    f.write(body)
print('  - phase3_logistic_regression.html exported')

# Export Phase 4 notebook
with open('analysis/phase4_effect_analysis.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase4_effect_analysis.html', 'w') as f:
    f.write(body)
print('  - phase4_effect_analysis.html exported')

# Export Phase 5 notebook
with open('analysis/phase5_manipulation_checks.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase5_manipulation_checks.html', 'w') as f:
    f.write(body)
print('  - phase5_manipulation_checks.html exported')

# Export Phase 6 notebook
with open('analysis/phase6_exploratory_analysis.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)
(body, _) = html_exporter.from_notebook_node(nb)
with open('frontend/public/results/phase6_exploratory_analysis.html', 'w') as f:
    f.write(body)
print('  - phase6_exploratory_analysis.html exported')

"

echo ""
echo "=== Step 2: Convert MEASUREMENT_PLAN.md to HTML ==="
pandoc analysis/MEASUREMENT_PLAN.md \
  -o frontend/public/results/MEASUREMENT_PLAN.html \
  --standalone \
  --include-in-header=<(echo "<style>$(cat analysis/measurement_plan.css)</style>")
echo "  - MEASUREMENT_PLAN.html generated from MD"

echo ""
echo "=== Step 3: Deploy ONLY results folder (no frontend rebuild) ==="
rsync -avz \
  -e "ssh -i ~/.ssh/id_jelastic -p 3022" \
  frontend/public/results/ \
  10200@gate.jpe.infomaniak.com:/var/www/webroot/ROOT/results/

echo ""
echo "=== Done! ==="
echo "Analysis reports updated (frontend unchanged):"
echo "  - Phase 1: https://chat-study.ailights.org/results/phase1_descriptive_statistics.html"
echo "  - Phase 2: https://chat-study.ailights.org/results/phase2_chi_square_analysis.html"
echo "  - Phase 3: https://chat-study.ailights.org/results/phase3_logistic_regression.html"
echo "  - Phase 4: https://chat-study.ailights.org/results/phase4_effect_analysis.html"
echo "  - Phase 5: https://chat-study.ailights.org/results/phase5_manipulation_checks.html"
echo "  - Phase 6: https://chat-study.ailights.org/results/phase6_exploratory_analysis.html"
echo "  - Measurement Plan: https://chat-study.ailights.org/results/MEASUREMENT_PLAN.html"
