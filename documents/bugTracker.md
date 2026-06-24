- [ ] prototype dashboard

- [ ] prototype tracker panel / section

- [ ] Teams object (like household) - Parent to Categories/Projects. May need a relation object for Users on the db so users can join a team/household and see its Categories/Projects

- [ ] project/category should have some field that allows you to engage with all its tasks (like we can for rules)

- [ ] 'complete task after end date' tickbox in Task; db field support
    - [ ] Rules should also be able to govern whether tasks are created with this toggled

- [x] settings panel
    - [ ] By default, should tasks with end dates auto-complete after window passes? [on/off]
    - [ ] Menu bar orientation {'desktop': ['top', 'left', 'bottom', 'right'], 'mobile': ['top', 'bottom']} [picklist]
    - [ ] theme [picklist]
    - [ ] change object bgs based on color value [on/off]
    - [ ] show border color indicator on object elements that support color [on/off]
    - [ ] Allow Dark Entity [on/off]

- [ ] sub-task support

- [ ] using the color dropper to select a color registers as an 'outside click' and immediately closes the color dropper widget, making custom color selection difficult

- [x] Tasks without an end date are not being rendered on timeline in day view - they should show as short blips at their due date in this case at minimum

- [x] Tasks on the calendar view (same is probably true for week view) block the user from clicking on the day element, making it harder to filter tasks list to a certain day

- [ ] Need an option to easily 'deselect' a day in week/month view and return filtering back to the broader view rather than the selected day - should probably be achievable just by clicking on the selected day again. Ensure this doesn't override the double click effect though

- [ ] We definitely aren't exposing all available emoji options; I had to add the laundry basket back manually myself

- [ ] We gotta come up with a smarter way to display tasks scheduled at the same time in the day view. Use up some of that horizontal space better.

- [ ] outlook-inspired: week view WITH daily timelines? i.e. x axis weekday y axis time of day

- [ ] condense calendar vertical spacing to make more room for task list; may be a bifurcation pt for mobile vs. desktop

================================================================================================


- [x] New categories are unticked to show in task list by default

- [x] Changing a rule's category should update its child task's categories

- [x] updating a rule should function the same way tasks do ; save automatically - no 'save' button

- [x] move running / enabled indicator button into expanded menu for rules; find a more space efficient indicator to convey a rule is enabled at a glance when collapsed

- [x] tasks should show their parent rule in expanded view

- [x] Rules seem to wait for a round trip to the db for the front end to reflect updates, like changing the color. This makes me think the AI created its own (shittier) pattern for updating rule state instead of just referring to projects or tasks. I'm pretty sure for those we were updating state on the frontend first and then relaying updates to the backend whenever we determined state changed. This seems to be consuming backend state only and therefore has to wait for the backend to update before it's reflected on frontend

- [x] collapsed rule card is taller (greater height) than the new rule field. Fix

- [x] task text in calendar views is hard-coded dark blue; this color should be derived from the task color (darkened version)

- [x] project card element width can change when one of its rules is expanded; this should be fixed width.

- [x] style app as true flat; remove the shadows from the sidebar and sidebar panel/section selection indicator

- [x] scroll bar appearing bumps horizontal positioning of on-screen elements. Can we absolute overlay it or something?

- [x] Fix alignment of tasks on timeline in calendar:day view - off by like 15 minutes

- [x] fix day element positionining in calendar:week view; presently it's like there's a top row that actually holds the tasks and then the 'day' (which is highlighted on hover) is like an entirely separate element somehow. We don't need one section for tasks and another section for ???. These should be merged

- [x] gap / spacing for icon and name field in rules top row changes slightly when expanded / collapsed. fix

- [x] fix colored element contrasts
