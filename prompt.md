You are working inside this repository:                                  
                                                                           
  D:\Aleyacare Clone\homecare-pro                                          
                                                                           
  Your job is to fix real business-logic and cross-module flow bugs in     
  this codebase. Do not redesign the app. Do not do unrelated refactors.   
  Do not add new features unless they are required to fix the listed       
  defects.                                                                 
                                                                           
  You must work carefully and only change the minimum code needed to make  
  the system logically correct for real-world home-care operations.        
                                                                           
  ### Non-negotiable rules                                                 
                                                                           
  1. Read these files first before editing anything:                       
      - roadmap.md                                                         
      - prisma/schema.prisma                                               
      - src/app/api/visits/route.js                                        
      - src/app/api/visits/[id]/route.js                                   
      - src/app/api/visits/conflicts/route.js                              
      - src/app/api/billing/invoices/uninvoiced-visits/route.js            
      - src/app/api/billing/invoices/generate-batch/route.js               
      - src/app/api/payroll/timesheets/generate/route.js                   
      - src/app/api/payroll/timesheets/[id]/entries/route.js               
      - src/components/payroll/GenerateTimesheetModal.jsx                  
      - src/app/api/care-plans/[id]/generate-visits/route.js               
      - src/app/api/staff/route.js                                         
      - src/lib/auth.js                                                    
  2. Before making changes, compare code against schema field names. Do    
     not assume route code is correct if it conflicts with prisma/         
     schema.prisma.                                                        
  3. Do not change database model names unless absolutely necessary.       
     Prefer fixing route logic to match the existing schema.               
  4. Do not introduce placeholders like TODO, FIXME, or comments saying    
     “implement later”.                                                    
  5. After each change group, run the smallest relevant verification       
     command.                                                              
  6. Do not touch unrelated files.                                         
                                                                           
  ———                                                                      
                                                                           
  ## Main defects you must fix                                             
                                                                           
  ### Defect 1: Billing routes use schema fields that do not exist         
                                                                           
  #### Problem                                                             
                                                                           
  These files reference fields that do not exist in the Prisma schema:     
                                                                           
  - src/app/api/billing/invoices/uninvoiced-visits/route.js                
  - src/app/api/billing/invoices/generate-batch/route.js                   
                                                                           
  Wrong assumptions currently used:                                        
                                                                           
  - visit.invoiceId                                                        
  - visit.scheduledStart                                                   
  - visit.scheduledEnd                                                     
  - service.rate                                                           
                                                                           
  Actual schema fields:                                                    
                                                                           
  - Visit.startTime                                                        
  - Visit.endTime                                                          
  - Visit.actualStart                                                      
  - Visit.actualEnd                                                        
  - Visit.invoiceItems                                                     
  - Service.baseRate                                                       
                                                                           
  #### Required fix
                                                                           
  Update both billing routes so they determine uninvoiced visits by        
  checking for absence of related invoice items, not by checking           
  invoiceId.                                                               
                                                                           
  Use Prisma relation filtering against invoiceItems:                      
                                                                           
  - only include visits where invoiceItems has no related rows             
                                                                           
  Use the correct time fields:                                             
                                                                           
  - preferred billing duration source:                                     
      1. actualStart + actualEnd                                           
      2. startTime + endTime                                               
      3. service.duration converted from minutes to hours                  
                                                                           
  Use the correct service price field:                                     
                                                                           
  - service.baseRate                                                       
                                                                           
  #### Expected logic                                                      
                                                                           
  For each completed or approved visit that is not yet invoiced:           
                                                                           
  - calculate hours                                                        
  - calculate amount = hours * service.baseRate                            
  - expose enough fields for invoice preview and batch generation          
                                                                           
  #### Exact changes                                                       
                                                                           
  In both billing files:                                                   
                                                                           
  - remove all use of invoiceId                                            
  - replace with relation filter on invoiceItems                           
  - remove all use of scheduledStart and scheduledEnd                      
  - replace with startTime and endTime                                     
  - remove all use of service.rate                                         
  - replace with service.baseRate                                          
                                                                           
  #### Important note                                                      
                                                                           
  The schema allows:                                                       
                                                                           
  - Visit -> many InvoiceItem                                              
  - InvoiceItem -> optional visitId                                        
                                                                           
  So the correct “already invoiced” test is relation-based, not scalar-    
  field-based.                                                             
                                                                           
  ———                                                                      
                                                                           
  ### Defect 2: Approved visits disappear from billing and payroll         
  pipelines                                                                
                                                                           
  #### Problem                                                             
                                                                           
  Visit lifecycle allows:                                                  
                                                                           
  - COMPLETED -> APPROVED                                                  
                                                                           
  But downstream logic only processes:                                     
                                                                           
  - status: 'COMPLETED'                                                    
                                                                           
  That means once a visit is approved, it stops appearing in:              
                                                                           
  - uninvoiced visit list                                                  
  - batch invoice generation                                               
  - timesheet generation                                                   
  - timesheet preview                                                      
                                                                           
  #### Required fix                                                        
                                                                           
  Treat both of these visit statuses as eligible for downstream            
  processing:                                                              
                                                                           
  - COMPLETED                                                              
  - APPROVED                                                               
                                                                           
  Do not change the visit lifecycle itself unless necessary. Fix the       
  downstream consumers.                                                    
                                                                           
  #### Exact files to update                                               
                                                                           
  - src/app/api/billing/invoices/uninvoiced-visits/route.js                
  - src/app/api/billing/invoices/generate-batch/route.js                   
  - src/app/api/payroll/timesheets/generate/route.js                       
  - src/components/payroll/GenerateTimesheetModal.jsx                      
                                                                           
  #### Exact logic                                                         
                                                                           
  Everywhere those flows select eligible visits, replace:                  
                                                                           
  - status: 'COMPLETED'                                                    
    with:                                                                  
  - status in ['COMPLETED', 'APPROVED']                                    
                                                                           
  If any UI labels still say “Completed Visits” when they really include   
  approved visits, update the wording to avoid user confusion.             
                                                                           
  Good labels:                                                             
                                                                           
  - “Completed / Approved Visits”                                          
  - “Eligible Visits”                                                      
  - “Eligible Visits for Timesheet Generation”                             
                                                                           
  ———                                                                      
                                                                           
  ### Defect 3: Scheduling conflict logic blocks back-to-back visits       
                                                                           
  #### Problem                                                             
                                                                           
  The app currently treats this as a conflict:                             
                                                                           
  - Visit A: 9:00 to 10:00                                                 
  - Visit B: 10:00 to 11:00                                                
                                                                           
  That is wrong in real scheduling.                                        
                                                                           
  Current overlap logic uses inclusive boundaries:                         
                                                                           
  - existing start <= new end                                              
  - existing end >= new start                                              
                                                                           
  #### Required fix                                                        
                                                                           
  Change overlap logic so visits conflict only if they truly overlap in    
  time.                                                                    
                                                                           
  Use half-open interval logic:                                            
                                                                           
  - conflict exists when:                                                  
      - existing.startTime < newEnd                                        
      - existing.endTime > newStart                                        
                                                                           
  This allows exact edge-touching without conflict.                        
                                                                           
  #### Exact files to update                                               
                                                                           
  - src/app/api/visits/route.js                                            
  - src/app/api/visits/[id]/route.js                                       
  - src/app/api/visits/conflicts/route.js                                  
                                                                           
  #### Exact replacement                                                   
                                                                           
  Every overlap condition that currently behaves like:                     
                                                                           
  - startTime <= end
  - endTime >= start                                                       
                                                                           
  must become:                                                             
                                                                           
  - startTime < end                                                        
  - endTime > start                                                        
                                                                           
  Be consistent in:                                                        
                                                                           
  - staff conflict checks                                                  
  - client conflict checks                                                 
  - recurrence conflict checks                                             
  - standalone conflict API                                                
                                                                           
  ———                                                                      
                                                                           
  ### Defect 4: Care-plan visit generation creates duplicates and wrong    
  visit meaning                                                            
                                                                           
  #### Problem                                                             
                                                                           
  src/app/api/care-plans/[id]/generate-visits/route.js has several real-   
  world logic defects:                                                     
                                                                           
  - running it twice creates duplicate visits                              
  - it does not perform conflict checks                                    
  - it hardcodes every generated visit to 9:00 AM                          
  - it creates monthly visits for AS_NEEDED and CUSTOM, which is           
    logically wrong                                                        
                                                                           
  #### Required fix                                                        
                                                                           
  Fix care-plan generation with minimal scope.                             
                                                                           
  #### Required behavior                                                   
                                                                           
  1. Do not auto-generate visits for:                                      
      - AS_NEEDED                                                          
      - CUSTOM                                                             
  2. Only auto-generate for:                                               
      - DAILY                                                              
      - WEEKLY                                                             
      - BI_WEEKLY                                                          
      - MONTHLY                                                            
  3. Before creating each generated visit, check whether an equivalent     
     visit already exists for the same:                                    
      - organization                                                       
      - care plan                                                          
      - client                                                             
      - service                                                            
      - startTime                                                          
      - endTime                                                            
                                                                           
  If yes:                                                                  
                                                                           
  - skip creation of that visit                                            
                                                                           
  4. Before creating each generated visit, check for actual scheduling     
     conflict using the same corrected overlap logic from the scheduling   
     routes.                                                               
  5. Do not fail the entire batch because one generated occurrence         
     conflicts or already exists.                                          
     Return a structured result showing:                                   
                                                                           
  - created                                                                
  - skippedAsDuplicate                                                     
  - skippedAsConflict                                                      
                                                                           
  6. Keep the current default time behavior only if there is no better     
     source already in the data model.                                     
     Since this route has no time-of-day configuration in the care plan,   
     you may keep default 9 AM, but make this explicit and stable.         
     Do not invent new schema fields for this task.                        
                                                                           
  #### Exact file                                                          
                                                                           
  - src/app/api/care-plans/[id]/generate-visits/route.js                   
                                                                           
  #### Output shape requirement                                            
                                                                           
  Return JSON with:                                                        
                                                                           
  - success                                                                
  - visitsCreated                                                          
  - visits                                                                 
  - skippedDuplicates                                                      
  - skippedConflicts                                                       
                                                                           
  Each skipped item should include enough detail to debug:                 
                                                                           
  - date/time                                                              
  - serviceId                                                              
  - reason                                                                 
                                                                           
  ———                                                                      
                                                                           
  ### Defect 5: Staff cannot modify their own timesheet entries because    
  ID types are mixed up                                                    
                                                                           
  #### Problem                                                             
                                                                           
  In:                                                                      
                                                                           
  - src/app/api/payroll/timesheets/[id]/entries/route.js                   
                                                                           
  The code compares:                                                       
                                                                           
  - timesheet.staffId                                                      
    against:                                                               
  - session.user.id                                                        
                                                                           
  But timesheet.staffId is a Staff.id                                      
  and session.user.id is a User.id                                         
                                                                           
  So staff users are incorrectly forbidden from editing their own          
  timesheets.                                                              
                                                                           
  #### Required fix                                                        
                                                                           
  Resolve the logged-in staff member correctly before permission           
  checking.                                                                
                                                                           
  #### Exact logic                                                         
                                                                           
  If session.user.role === 'STAFF':                                        
                                                                           
  1. fetch staff record by userId = session.user.id                        
  2. get that staff record’s id                                            
  3. compare that Staff.id to timesheet.staffId                            
                                                                           
  If no staff record exists:                                               
                                                                           
  - return forbidden or a clear error                                      
  - do not allow modification                                              
                                                                           
  #### Exact file                                                          
                                                                           
  - src/app/api/payroll/timesheets/[id]/entries/route.js                   
                                                                           
  Also inspect these files for the same bad comparison pattern:            
                                                                           
  - src/app/api/payroll/timesheets/route.js                                
  - src/app/api/payroll/timesheets/[id]/route.js                           
                                                                           
  If those files already resolve staff correctly, leave them alone. Only   
  change real bugs.                                                        
                                                                           
  ———                                                                      
                                                                           
  ### Defect 6: Timesheet preview modal expects the wrong visit response   
  shape                                                                    
                                                                           
  #### Problem                                                             
                                                                           
  src/components/payroll/GenerateTimesheetModal.jsx expects fields that /  
  api/visits does not return:                                              
                                                                           
  - v.date                                                                 
  - staffFirstName                                                         
  - staffLastName                                                          
  - scheduledStart                                                         
  - scheduledEnd                                                           
                                                                           
  But /api/visits returns:                                                 
                                                                           
  - startTime                                                              
  - endTime                                                                
  - actualStart                                                            
  - actualEnd                                                              
  - nested staff                                                           
  - nested client                                                          
  - nested service                                                         
                                                                           
  So preview is logically inconsistent and may silently fail.              
                                                                           
  #### Required fix                                                        
                                                                           
  Update the modal to use the actual API response shape.                   
                                                                           
  #### Exact file                                                          
                                                                           
  - src/components/payroll/GenerateTimesheetModal.jsx                      
                                                                           
  #### Required logic                                                      
                                                                           
  When previewing eligible visits:                                         
                                                                           
  - use new Date(v.startTime) for visit date filtering                     
  - get staff display name from nested v.staff                             
  - calculate hours from:                                                  
      1. actualStart + actualEnd                                           
      2. startTime + endTime                                               
  - allow statuses COMPLETED and APPROVED                                  
  - ignore visits without staffId                                          
                                                                           
  #### Important                                                           
                                                                           
  Do not modify /api/visits just to match this broken component unless     
  absolutely necessary. Prefer fixing the component to match the           
  established API response.                                                
                                                                           
  ———                                                                      
                                                                           
  ### Defect 7: Multi-tenant identity logic conflicts with the intended    
  SaaS model                                                               
                                                                           
  #### Problem                                                             
                                                                           
  The roadmap says this is a multi-tenant SaaS app, but current schema     
  and auth logic make email globally unique for User and Staff.            
                                                                           
  Current schema:                                                          
                                                                           
  - User.email is globally unique                                          
  - Staff.email is globally unique                                         
  - there are also tenant-scoped unique indexes, but the global unique     
    constraints override them in practice                                  
                                                                           
  Current code also uses global email lookup in auth and staff creation.   
                                                                           
  This means two organizations cannot reuse the same email, which is       
  usually wrong for multi-tenant SaaS.                                     
                                                                           
  #### Required fix                                                        
                                                                           
  Choose the safer repair that aligns with tenant scoping:                 
                                                                           
  1. Schema                                                                
      - remove global unique from:                                         
          - User.email                                                     
          - Staff.email                                                    
      - keep or rely on tenant-aware uniqueness:                           
          - @@unique([organizationId, email]) for User                     
          - @@unique([organizationId, email]) for Staff                    
  2. Auth                                                                  
      - update login logic in src/lib/auth.js so login cannot rely on      
        findUnique({ where: { email } })                                   
      - use tenant-aware lookup strategy                                   
                                                                           
  #### Critical constraint                                                 
                                                                           
  Because the login form currently only asks for email + password, you     
  must not invent a perfect enterprise tenant-discovery system. Use the    
  minimum viable safe behavior that fits the current UI.                   
                                                                           
  #### Recommended implementation                                          
                                                                           
  Use:                                                                     
                                                                           
  - prisma.user.findMany({ where: { email: credentials.email, status:      
    true }, include: ... })                                                
                                                                           
  Then:                                                                    
                                                                           
  1. if zero users found:                                                  
      - invalid credentials                                                
  2. if one user found:                                                    
      - verify password and proceed                                        
  3. if more than one user found:                                          
      - reject login with a clear error such as:                           
          - "Multiple accounts exist for this email. Contact your          
            administrator."                                                
                                                                           
  This avoids silent cross-tenant login ambiguity without forcing a UI     
  redesign in this task.                                                   
                                                                           
  #### Staff creation and update                                           
                                                                           
  Update duplicate checks in:                                              
                                                                           
  - src/app/api/staff/route.js                                             
  - src/app/api/staff/[id]/route.js                                        
                                                                           
  They must enforce uniqueness within the current organization, not        
  globally across all tenants.                                             
                                                                           
  #### Also update Prisma schema                                           
                                                                           
  File:                                                                    
                                                                           
  - prisma/schema.prisma                                                   
                                                                           
  You must add:                                                            
                                                                           
  - @@unique([organizationId, email]) to Staff if it is not already        
    present                                                                
  - remove global @unique from User.email                                  
  - remove global @unique from Staff.email                                 
                                                                           
  #### Migration                                                           
                                                                           
  Create a Prisma migration for the schema change.                         
                                                                           
  Do not hand-wave this. Actually update schema and migration files.       
                                                                           
  ———                                                                      
                                                                           
  ## Implementation order                                                  
                                                                           
  Follow this exact order.                                                 

  ### Step 1: Fix billing schema mismatches                                
                                                                           
  Files:                                                                   
                                                                           
  - src/app/api/billing/invoices/uninvoiced-visits/route.js                
  - src/app/api/billing/invoices/generate-batch/route.js                   
                                                                           
  Tasks:                                                                   
                                                                           
  - replace wrong field names
  - replace invoice eligibility logic                                      
  - support completed and approved visits                                  
  - make amount calculation use baseRate                                   
                                                                           
  ### Step 2: Fix scheduling overlap logic                                 
                                                                           
  Files:                                                                   
                                                                           
  - src/app/api/visits/route.js                                            
  - src/app/api/visits/[id]/route.js                                       
  - src/app/api/visits/conflicts/route.js                                  
                                                                           
  Tasks:                                                                   
                                                                           
  - replace inclusive overlap checks with strict overlap checks            
                                                                           
  ### Step 3: Fix payroll preview and generation eligibility               
                                                                           
  Files:                                                                   
                                                                           
  - src/components/payroll/GenerateTimesheetModal.jsx                      
  - src/app/api/payroll/timesheets/generate/route.js                       
                                                                           
  Tasks:                                                                   
                                                                           
  - use actual visit shape                                                 
  - include approved visits as eligible                                    
                                                                           
  ### Step 4: Fix timesheet ownership permission bug                       
                                                                           
  File:                                                                    
                                                                           
  - src/app/api/payroll/timesheets/[id]/entries/route.js                   
                                                                           
  Task:                                                                    
                                                                           
  - compare timesheet staff owner to resolved Staff.id, not User.id        
                                                                           
  ### Step 5: Fix care-plan generation dedupe and frequency semantics      
                                                                           
  File:                                                                    
                                                                           
  - src/app/api/care-plans/[id]/generate-visits/route.js                   
                                                                           
  Tasks:                                                                   
                                                                           
  - skip AS_NEEDED                                                         
  - skip CUSTOM                                                            
  - prevent duplicates                                                     
  - skip conflicts                                                         
  - return structured result                                               
                                                                           
  ### Step 6: Fix multi-tenant email logic                                 
                                                                           
  Files:                                                                   
                                                                           
  - prisma/schema.prisma                                                   
  - src/lib/auth.js                                                        
  - src/app/api/staff/route.js                                             
  - src/app/api/staff/[id]/route.js                                        
                                                                           
  Tasks:                                                                   
                                                                           
  - remove global uniqueness                                               
  - keep tenant uniqueness                                                 
  - make login safe when duplicate email exists across tenants             
  - make staff duplicate checks organization-scoped                        
                                                                           
  ### Step 7: Add and run verification                                     
                                                                           
  You must add or update tests where the repo already has coverage         
  patterns. If adding tests is too expensive in this repo, at minimum run  
  targeted build/test commands and manually verify the affected routes by  
  reasoning from returned shapes.                                          
                                                                           
  ———                                                                      
                                                                           
  ## Detailed code expectations                                            
                                                                           
  ### Billing route expectations                                           
                                                                           
  In both billing files, the Prisma where clause for eligible visits       
  should behave like this:                                                 
                                                                           
  - organization matches current session                                   
  - visit status in ['COMPLETED', 'APPROVED']                              
  - visit has no invoice items yet                                         
  - optional client/date filters still work                                
                                                                           
  Use relation filter style equivalent to:                                 
                                                                           
  - invoiceItems: { none: {} }                                             
                                                                           
  If Prisma requires more specific syntax, use valid Prisma syntax. Do     
  not fake it.                                                             
                                                                           
  ### Hours calculation helper logic                                       
                                                                           
  If you see repeated hour-calculation logic across billing and payroll    
  preview/generation, you may extract a small helper only if it reduces    
  duplication without spreading changes across many files.
                                                                           
  If you extract a helper:                                                 
                                                                           
  - put it in a sensible small file under src/lib                          
  - keep it narrowly focused                                               
  - do not refactor the world                                              
                                                                           
  The helper must:                                                         
                                                                           
  1. use actualStart/actualEnd if both exist                               
  2. else use startTime/endTime if both exist                              
  3. else use service.duration / 60 if duration exists                     
  4. else return 0                                                         
                                                                           
  ### Conflict logic expectations                                          
                                                                           
  Use strict overlap:                                                      
                                                                           
  - overlapping if existing.start < newEnd && existing.end > newStart      
                                                                           
  Do not count edge-touching visits as conflicts.                          
                                                                           
  Keep cancellation excluded from conflict checks.                         
                                                                           
  ### Care-plan generation expectations                                    
                                                                           
  For each generated candidate:                                            
                                                                           
  1. compute candidate start/end                                           
  2. check if equivalent visit already exists                              
  3. check staff conflict if a staff member is assigned                    
  4. check client conflict                                                 
  5. if duplicate -> skip duplicate                                        
  6. else if conflict -> skip conflict                                     
  7. else create visit                                                     
                                                                           
  Do not abort the whole request because one occurrence is skipped.        
                                                                           
  For AS_NEEDED and CUSTOM:                                                
                                                                           
  - create nothing automatically                                           
  - do not convert them into monthly visits                                
                                                                           
  ### Tenant-aware auth expectations                                       
                                                                           
  In src/lib/auth.js:                                                      
                                                                           
  - stop using findUnique({ where: { email } })                            
  - use findMany by email                                                  
  - include staff/client/branch as before                                  
  - if more than one account exists for same email:                        
      - fail safely                                                        
      - do not log in the wrong tenant                                     
                                                                           
  Do not silently pick the first record.                                   
                                                                           
  ### Staff duplicate check expectations                                   
                                                                           
  In src/app/api/staff/route.js and src/app/api/staff/[id]/route.js:       
                                                                           
  - duplicate user and staff email checks must include organizationId:     
    session.user.organizationId                                            
  - on update, exclude the current staff/user where needed                 
                                                                           
  ———                                                                      
                                                                           
  ## Commands you must run                                                 
                                                                           
  Run these after each logical group, and fix errors before moving on.     
                                                                           
  ### After schema change                                                  
                                                                           
  Run:                                                                     
                                                                           
  npx prisma validate                                                      
  npx prisma generate                                                      
                                                                           
  If you created a migration, also run:                                    
                                                                           
  npx prisma migrate dev --name tenant_email_scope_fix                     
                                                                           
  ### After route/component changes                                        
                                                                           
  Run:                                                                     
                                                                           
  npm run lint                                                             
  npm run build                                                            
                                                                           
  If targeted test files exist and are relevant, run them too.             
                                                                           
  Search for affected broken field names after your edits:                 
                                                                           
  rg "invoiceId|scheduledStart|scheduledEnd|service\\?\\.rate|rate: true"  
src                                                                        
                                                                           
  Search for old inclusive overlap comparisons:                            
                                                                           
  rg "startTime: \\{ lte:|endTime: \\{ gte:" src/app/api/visits            
                                                                           
  Search for remaining global unique email definitions:                    
                                                                           
  rg "@unique|@@unique\\(\\[organizationId, email\\]\\)" prisma/           
schema.prisma                                                              
                                                                           
  ———                                                                      
                                                                           
  ## Acceptance criteria                                                   
                                                                           
  Your work is only complete if all of the following are true:             
                                                                           
  1. Billing preview and batch invoice routes no longer reference          
     nonexistent schema fields.                                            
  2. Uninvoiced visits are determined by invoice-item relationship, not    
     fake invoiceId.                                                       
  3. Approved visits still participate in invoice and timesheet            
     workflows.                                                            
  4. Back-to-back visits are allowed and are not flagged as conflicts.     
  6. Re-running care-plan generation does not create duplicate visits for  
  7. Staff can modify their own timesheet entries when they own the        
  8. Payroll preview modal uses the actual /api/visits response shape.
  9. Email uniqueness is tenant-scoped, not globally forced.
  10. Auth does not silently log into the wrong tenant when duplicate
     emails exist across organizations.
  11. npm run lint passes.
  12. npm run build passes.
  13. Prisma schema validates and generates.

  ———

  ## Final output format you must produce after editing

  When finished, output:

  1. A short summary of files changed
  2. A list of the business rules corrected
  3. The exact verification commands run
  4. Any remaining risks or follow-up items

  Do not output vague statements like “fixed some bugs”.

  ## Assumptions and defaults

  - Use the existing schema names unless a listed schema fix is required.
  - Keep default 9 AM care-plan generation time because there is no
    scheduling-time configuration in the current care plan model.
  - Do not add new UI fields for tenant selection.
  - Prefer narrow safe fixes over broad architectural rewrites.
