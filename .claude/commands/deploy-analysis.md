Export all analysis Jupyter notebooks to HTML, commit, push, and remind to deploy on Jelastic.

Steps:
1. Export notebooks to HTML in analysis/ folder
2. Convert MEASUREMENT_PLAN.md to HTML (preserving VSCode CSS styling)
3. Commit and push to GitHub
4. Remind user to Update from Git on Jelastic

Run these commands in sequence:

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && source venv/bin/activate && jupyter nbconvert --to html --output-dir analysis analysis/phase1_descriptive_statistics.ipynb analysis/phase2_chi_square_analysis.ipynb analysis/phase3_logistic_regression.ipynb analysis/phase4_effect_analysis.ipynb analysis/phase5_manipulation_checks.ipynb analysis/phase6_exploratory_analysis.ipynb
```

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && head -230 analysis/MEASUREMENT_PLAN.html > /tmp/html_header.txt && cat /tmp/html_header.txt > analysis/MEASUREMENT_PLAN.html && echo '</head><body class="vscode-body vscode-light">' >> analysis/MEASUREMENT_PLAN.html && pandoc analysis/MEASUREMENT_PLAN.md -t html >> analysis/MEASUREMENT_PLAN.html && echo '</body></html>' >> analysis/MEASUREMENT_PLAN.html
```

```bash
cd /Users/sabinewildemann/Documents/A_EGO/2_Studium/1_Thesis/chatbot-study && git add analysis/*.html && git commit -m "chore: Update analysis HTML exports" && git push
```

After pushing, tell the user:
- Go to Jelastic → chat-study → Deployments → ROOT → click Update from Git

URLs after deployment:
- https://chat-study.ailights.org/analysis/MEASUREMENT_PLAN.html
- https://chat-study.ailights.org/analysis/phase1_descriptive_statistics.html
- https://chat-study.ailights.org/analysis/phase2_chi_square_analysis.html
- https://chat-study.ailights.org/analysis/phase3_logistic_regression.html
- https://chat-study.ailights.org/analysis/phase4_effect_analysis.html
- https://chat-study.ailights.org/analysis/phase5_manipulation_checks.html
- https://chat-study.ailights.org/analysis/phase6_exploratory_analysis.html
