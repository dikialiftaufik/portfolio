-- 0003_fix_cert_image_typo
-- The legacy image file "cert-innovaiition-plan-2025.jpg" was renamed to
-- "cert-innovation-plan-2025.jpg" (see scripts/optimize-images.mjs).
-- Run right after deploying the new build. Idempotent.
update public.certificates
   set image = replace(image, 'cert-innovaiition-plan-2025', 'cert-innovation-plan-2025')
 where image like '%cert-innovaiition-plan-2025%';
