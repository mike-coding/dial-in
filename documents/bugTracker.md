- [x] New categories are unticked to show in task list by default

- [x] Changing a rule's category should update its child task's categories

- [x] updating a rule should function the same way tasks do ; save automatically - no 'save' button

- [x] move running / enabled indicator button into expanded menu for rules; find a more space efficient indicator to convey a rule is enabled at a glance when collapsed

- [ ] tracker panel / section

- [ ] 'complete task after end date' tickbox in Task; db field support
    - [ ] Rules should also be able to govern whether tasks are created with this toggled

- [ ] settings panel
    - example setting for first implementation: 
        - [ ] By default, should tasks with end dates auto-complete after window passes?

- [ ] prototype dashboard

- [x] style app as true flat; remove the shadows from the sidebar and sidebar panel/section selection indicator

- [ ] Fix alignment of tasks on timeline in calendar:day view

- [ ] fix day element positionining in calendar:week view; presently it's like there's a top row that actually holds the tasks and then the 'day' (which is highlighted on hover) is like an entirely separate element somehow. We don't need one section for tasks and another section for ???. These should be merged

- [ ] task text in calendar views is hard-coded dark blue; this color should be derived from the task color (darkened version)

- [ ] project card element width can change when one of its rules is expanded; this should be fixed width.

- [ ] scroll bar appearing bumps horizontal positioning of on-screen elements. Can we absolute overlay it or something?

- [ ] tasks should show their parent rule in expanded view

- [ ] Rules seem to wait for a round trip to the db for the front end to reflect updates, like changing the color. This makes me think the AI created its own (shittier) pattern for updating rule state instead of just referring to projects or tasks. I'm pretty sure for those we were updating state on the frontend first and then relaying updates to the backend whenever we determined state changed. This seems to be consuming backend state only and therefore has to wait for the backend to update before it's reflected on frontend

- [ ] collapsed rule card is taller (greater height) than the new rule field. Fix

- [ ] project/category should have some field that allows you to engage with all its tasks (like we can for rules)