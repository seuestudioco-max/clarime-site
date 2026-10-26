/*
# Tighten Clarimê profile grants

1. Security correction
- Profiles can be viewed by the signed-in owner.
- Signed-in users may update only their display name.
- Direct profile insertion, deletion, role changes, email changes and timestamp changes are removed from the browser role.

2. Important Notes
- New profiles continue to be created by the protected auth trigger.
- Store authorization still comes from the database-side role check.
*/

REVOKE INSERT, DELETE, UPDATE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
