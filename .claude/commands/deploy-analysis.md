Export all analysis Jupyter notebooks to HTML and deploy to Infomaniak via SSH.

Steps:
1. Export notebooks to HTML using jupyter nbconvert
2. Convert MEASUREMENT_PLAN.md to HTML using pandoc
3. Upload all HTML files to Jelastic via rsync/SSH

Run these commands in sequence:

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && source venv/bin/activate && jupyter nbconvert --to html --output-dir frontend/public/results analysis/phase1_descriptive_statistics.ipynb analysis/phase2_chi_square_analysis.ipynb analysis/phase3_logistic_regression.ipynb analysis/phase4_effect_analysis.ipynb analysis/phase5_manipulation_checks.ipynb analysis/phase6_exploratory_analysis.ipynb
```

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && pandoc analysis/MEASUREMENT_PLAN.md -o frontend/public/results/MEASUREMENT_PLAN.html --standalone
```

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && rsync -avz -e "ssh -i ~/.ssh/id_jelastic -p 3022" frontend/public/results/ 10200@gate.jpe.infomaniak.com:/var/www/webroot/ROOT/results/
```

After successful deployment, confirm the URLs are accessible:
- https://chat-study.ailights.org/results/phase1_descriptive_statistics.html
- https://chat-study.ailights.org/results/phase2_chi_square_analysis.html
- https://chat-study.ailights.org/results/phase3_logistic_regression.html
- https://chat-study.ailights.org/results/phase4_effect_analysis.html
- https://chat-study.ailights.org/results/phase5_manipulation_checks.html
- https://chat-study.ailights.org/results/phase6_exploratory_analysis.html
- https://chat-study.ailights.org/results/MEASUREMENT_PLAN.html
