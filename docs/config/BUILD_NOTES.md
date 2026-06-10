# Build Notes

## Tailwind CSS

Working compile command (confirmed):

```powershell
npx tailwindcss@3.4.17 -i tailwind.input.css -o tailwind.css
```

Notes:
- This project does not include `package.json` or `node_modules`.
- `npx tailwindcss` without a version may fail; pinning `@3.4.17` worked.
