# HematoBoard · canonical Material dashboard

Цей репозиторій містить канонічну публічну збірку read-only HematoBoard:

- `/` і `/mui/` — основний Material dashboard;
- `/fluent/` і `/patternfly/` — лише порівняльні реалізації;
- `case006-prototype.json` — public-safe проєкція CASE006;
- `clinical-copy-ua.json` — українська презентаційна редактура, прив’язана до незмінної reasoning-revision за ID і SHA-256.

У презентаційному шарі демографія «чоловік, 44 роки» має окрему квитанцію
`user_supplied`; її інтеграція до приватного джерельного шару лишається
відкладеною. Це не змінює клінічний стан кейсу.

Дизайн і вихідний код канонічної поверхні зберігаються у workspace HematoBoard в `prototypes/ui-framework-comparison/src/mui/`, `PRODUCT.md` і `DESIGN.md`. Цей репозиторій є еталонним публічним build-артефактом для [GitHub Pages](https://esannikov.github.io/hematoboard/).

## Клінічна межа

CASE006 лишається кандидатною проєкцією для підготовки до консиліуму. Технічна валідація і публікація не означають прийняття клінічного висновку лікарем.

## Release

Поточний реліз: `20260811-material-canonical-4`. Машиночитана провенанс-інформація міститься в `release.json`.
