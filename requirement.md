Role: Act as a expert website designer with 20+years of experince in designing production grade Learning management solution.

Goal: is to design a asthetic, creative and innovative website and dashboard for NxtGen Academy.

Dashboard :
    Admin and Student.

Details:
    Menu : Should be fixed across all pages, can be edited from Admin Login. The menu contnet will as follows :
    Home | Courses | Certifications | Tools | Upcoming batches| Corporate | Login/Signup

    Home Page: 
        Theme : refer to Theme.png from folder screenshots
        Logo | NxtGen Aacdemy
        Menu - section fixed.
        Hero Section : Sliding banners with full width equivalent to display screen. every sliders with text overlay in half section and images in other half :
        refer to : https://smartslider3.com/virtual-conference/  and https://smartslider3.com/free-full-width/ for automous carousel slider olny.
        example image for slider refer to 1.png and 2.png from folder screenshots

        upon scroll below : cousers tiles or foffering with creativce punchlines, with explore more buttons.

        upon scrolling further : certification details and punchline, with explore more buttons

        upon scrolling further : Give sliders for Tools and healine for each tool,  with explore more buttons.

        upon scrolling further : a section with coreporate training , creative and effective puncline. with course slider  with explore more buttons.

        Footer : refer to http://localhost:3000/academy section for structure only.

        Note: refer http://localhost:3000/academy for page structure, theme and punclines.
        for any reference image, refer to screenshots folder.

    Courses Page:
        Tabs for each techonloy Sections : Keep AI section as default:
            Artificial Intelligence Section :
                Tiles for all course
                1. Data Analyst with GenAI
                2. Generative AI Master Class
                3. Agentic AI 
                4. Prompt Enginering
                5. Python for Prgrammers
            Database Administrator:
                1. Azure and SQL DBA
                2. Postrgress SQL DBA
                3. Oracle DBA          
                4. MySQl DBA
        Couser Content :
            refer the AI course contnet from folder screenshots with respective images and pdf.
            for Database admintrator refer pdf in same folder else just create the content withAI.
    Certification:
            we have 200 certification available with name, link and prerequiste:
                each tile should mention pre-requisuite along with name and link.
            refer the certification pdf from same screenshots folder.
    Tools: we do not need page on clickingof tool rathr create page and fucntilaity for each tool available in dropdown.
        refer the tool from resume tool section of tools.png from screen shot folder and 
        refer functilaity of each tool from https://resumegyani.in/ from resume tool section.
    Upcoming batches :
        list the Data analyst with GenAI starting from 3rd of Aug. 
        this functinality should come from admin section of dashboard.
    corporate :
        Get first 3 couses from Artificial Intelligence Section.
        This should also come from admin section of dashboard.
    Login:
        refer the D:\Product Development\pavy-website fro login and dhaboard redirection.

- Now Dashboard Section -all dashboar should be accessbile only after valid login nad based on role assigned to login id it should id it should redirect respectively.
Typically 3 type of user : admin, student ( no sign-up , admin will create and send id password. ), 3rd type, site user, who will subscribe to Tools functionality.

--------------Functionality After Login -------------------------

1. Admin Dashboard :
    1. refer admin dahsboard from D:\Product Development\pavy-website site.
    2. Add Upcoming batches configuration ( we can add coming batches, launch date, webinaar before launch date)
    3. Add corporate courses configuration (we can add couses and details of courses.)
    4. Class Schedular : we can select the batch, course and enter date time, zoom link etc.)
    5. add Batch Configuration: we can enter batch name, add students to batch, add applicable certification, add batch wise study material, able to linke google drive folder or link for video recording, assignments and quizzes.
    6. Admin will able to create user and assign role to any exiting user like user directorty
    7. Add template skill, where we can give resume snapshot and it will create a real resume format then one approved it willa dd template to template library. Libray will be categorised as prepmium and free template. premium will have access only on subscribed user.

2. Student Dashboard:
    1. all the courses subscribed by students in tiles. it could be one or more than one.
    2. Once Clicked on Course : Open a course overviwe page which have following:
        Course Progress (refer to course_overview.png from sccreenshots folder)
    3. Once Clicked on Course : along with overview page in center, on left hand side overall functionlaity show icons + names of menu slidable vertcle bar should open just like gemini or chatgpt landing page.
    4.  Verticle left hand icons + names of menu will have following :
        Overview  |Study Material | Class Schedule | Certification |Resume Builder |Cover Letter | Tailor Resume |Linkedin Profile Analyser |ATS Score Checker| Interview Prepartion | Live Interview Prep.| Interview Assist | Job Support
    5. Once clicked on Study Material : a horizontal menu with following tabs should be there. each tab will have their own functinality:
        Study Material | Class Notes | Recoded Session | Assigments | Quizzes
    content and material for each tab should be uplaoded from admin section based on course and Batch. 
    6. Once Clicked on Class Schedule : It showcase the scheduled class name, date timing, zoom link, students can join by clciking on zoom link. ( it should be come from admin section of class scheduler)
    7. once clicked on Certification : only certification applicable to this course should be visible.
    8. by clicking on Resume builder, cover letter, Tailor Resume |Linkedin Profile Analyser |ATS Score Checker| Interview Prepartion, it shoule able to render functilaity mentioned defined in website page , these linked are locked one means they will have subcription based avaialbility.
    need one section "unlock all" fucntinality in top left . refer to dashboard1.png.
    upon clicking unlock all a pop should come up with package details. refer dasboard3.png.
    9. Live Interview Prep. and Job Support is exlcusive link, that is also binded with pakage details, where as Job Support will have exclusive subcription, like who are not the student they also can buy only -Job support segment.
    10. Live interview will have the avatar based functionality . refer the D:\Experiements\Avatar-Amit folder for the fuctinality. 
    11. Interview Assist will have the echo desktop functionlity from D:\Experiements\Aman\MindSync. refer the echo desktop functionality.



by using Details segment, create a visual layout plan. Use the MCP like google stich and UI-UX max pro skill mentioned in D:\Experiements\pavy-website\.agents\skills
 get the strcuture of dashboar from d3.png from D:\Product Development\NxtGen_Academy\Screenshots folder.

 refer the database skill from D:\Product Development\pavy-website, use MySQL db for all schema.
 create the schema layout need for this .

 Refer Agents.md, design.md and skill.md for design contraints and agent behaviour.

 Create a Creative, Asthetic, Innvovation visual layout. then create a implementaion plan and task plan before proceding to development. take approval.

 take design from :

 Build a single-page hero landing page for a product called "Axon" — a platform that deploys digital workers for mundane workflows. The page is a full-viewport hero section with a looping background video and overlaid content.

**Fonts:**
- Load Google Fonts: `Instrument Serif` (regular + italic) and `Inter` (weights 400, 500, 600).
- Body font: `Inter`, color `#1B133C`.
- Heading font: `Instrument Serif`.

**Page structure (single full-screen section, 100vh):**

1. **Navigation bar** — centered at the top with `pt-4 md:pt-6` padding. A horizontal nav pill with `bg-white/70 backdrop-blur-md rounded-xl px-4 md:px-6 py-3 shadow-sm`. Contains:
   - A custom SVG logo (two geometric arrow/chevron shapes in `#1B133C`, 24x24px). The SVG paths are: `M 256 256 L 128 256 L 0 128 L 128 128 Z` and `M 256 128 L 128 128 L 0 0 L 128 0 Z` inside a 256x256 viewBox.
   - Navigation links (hidden on mobile, shown `sm:` and up): "Features", "Plans", "Security", "About" — styled as `text-sm font-medium text-[#1B133C]/80` with hover transition to full opacity.

2. **Hero content** — centered below nav with `mt-8 md:mt-16`, stacked vertically:
   - **Badge**: `mb-6`, inline-flex pill with `rounded-xl border border-[#1B133C]/10 bg-white/70 backdrop-blur-sm px-4 py-2 text-sm font-medium`. Contains an orange square icon (`bg-orange-500 rounded w-5 h-5`) with a bold white "Y" letter, followed by text "Funded by Y Combinator".
   - **Heading**: `font-['Instrument_Serif'] text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-[#1B133C] max-w-4xl`. Two lines:
     - "Deploy digital workers"
     - "for mundane workflows"
   - **Subtitle**: `mt-5 sm:mt-6 max-w-3xl text-xs sm:text-sm md:text-base leading-relaxed text-[#1B133C]/70`. Text: "Eliminate your tedious browser work and 10x your team's capacity. Put intelligent agents on every routine process so you grow faster and deliver more for clients — effortlessly."
   - **CTA button**: `mt-7 sm:mt-8`, styled as `rounded-xl bg-[#FEFEFE] px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-[#1B133C] shadow-[0px_4px_12px_rgba(0,0,0,0.15)]` with hover shadow `shadow-[0px_6px_16px_rgba(0,0,0,0.2)]` and `transition-all duration-300`. Text: "Get Early Access".

3. **Background video** — absolutely positioned (`absolute inset-0 z-0`) behind all content. The video element uses:
   - URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260714_113715_c7e0daa0-8bdd-4486-a2da-040901f8f0ea.mp4`
   - Attributes: `autoPlay muted loop playsInline`
   - Styling: `w-full h-[130%] object-cover object-top` — full width, 130% height so it overflows vertically, with the focal point anchored to the top.

**CSS reset in index.css:**
```
body { font-family: 'Inter', sans-serif; color: #1B133C; }
```

**Key details:**
- The hero section uses `relative h-screen w-full overflow-hidden flex flex-col`.
- All content elements are `relative z-10` to sit above the video (`z-0`).
- No other sections or pages — just this single hero.
- Color palette: deep navy `#1B133C` for text, white/translucent for glass elements, orange-500 for the Y Combinator badge accent.
- Page title: "Axon — Digital Workers for Mundane Workflows"