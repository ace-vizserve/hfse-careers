Execute this workflow for the current Git repository.

1. Detect the current branch name.
2. Review the changes on the current branch before staging anything:
   - Run `git status`
   - Run `git diff --stat`
   - Run `git diff`
   - Summarize the changes clearly and identify anything risky or unusual
3. Run validation checks before any Git write action:
   - `npm run lint`
   - `npm run build`
4. If either command fails:
   - Stop immediately
   - Do not run `git add .`, `git commit`, `git pull`, or `git push`
   - Summarize the errors and what must be fixed
5. If both commands pass:
   - Run `git add .`
   - Create a conventional commit message based on the reviewed changes
   - The commit message must be comprehensive but no more than 4 lines total
   - Include the optional user arguments in the commit context when relevant: `$ARGUMENTS`
6. Before pushing, sync safely with the remote branch:
   - Run `git pull --rebase origin <current-branch>`
   - Replace `<current-branch>` with the detected branch name
7. If rebase fails or has conflicts:
   - Stop immediately
   - Do not push
   - Explain the conflict or failure clearly
8. If rebase succeeds:
   - Run `git push origin <current-branch>`

Rules:
- Use conventional commits such as `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, or `test:`
- Do not force push
- Do not push to a different branch
- Do not skip lint or build
- Do not continue when there are validation errors or rebase conflicts
- Keep the output concise: review summary, validation result, commit message used, and final push status
