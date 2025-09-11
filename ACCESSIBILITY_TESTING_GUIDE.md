# Accessibility Testing Guide for Flashcard Frenzy

## 🎯 **Accessibility Features Implemented**

### **1. Screen Reader Support**
- **`aria-live="polite"`** - Announces real-time game events without interrupting
- **`aria-atomic="true"`** - Ensures complete announcements are read
- **`role="status"`** - Identifies the announcement region
- **`aria-label="Game announcements"`** - Describes the purpose of the live region

### **2. Form Accessibility**
- **Clear labels** for all inputs and buttons
- **`aria-describedby`** - Links inputs to help text
- **`aria-required="true"`** - Indicates required fields
- **`sr-only`** help text - Provides context for screen readers

### **3. Button Accessibility**
- **Descriptive button text** - Clear action descriptions
- **Disabled state handling** - Proper disabled attributes
- **Focus management** - Keyboard navigation support

## 🧪 **Testing Scenarios**

### **Scenario 1: Two Players Join Same Match**
1. **Player 1**: Open `/game/test-match-123` in browser tab 1
2. **Player 2**: Open `/game/test-match-123` in browser tab 2
3. **Expected**: Screen reader announces "Player [ID] joined the match"

### **Scenario 2: Real-time Answer Events**
1. **Player 1**: Answer the question "What is 2 + 2?" with "4"
2. **Player 2**: Should see the answer appear in Game Activity
3. **Expected**: Screen reader announces "Player [ID] answered correctly! New score: 1"

### **Scenario 3: Scoreboard Updates**
1. **Multiple answers** from different players
2. **Scoreboard** should update in real-time
3. **Expected**: Screen reader announces score changes

## 🔍 **How to Test Accessibility**

### **Using Screen Reader (NVDA/JAWS)**
1. **Enable screen reader**
2. **Navigate to game page**
3. **Listen for announcements** when:
   - Players join
   - Answers are submitted
   - Scores update

### **Using Browser DevTools**
1. **Open DevTools** (F12)
2. **Go to Accessibility tab**
3. **Check for**:
   - Proper ARIA labels
   - Live regions
   - Form associations

### **Keyboard Navigation**
1. **Tab through** all interactive elements
2. **Verify** focus indicators are visible
3. **Test** form submission with Enter key

## 📋 **Verification Checklist**

- [ ] **`aria-live="polite"`** announces player joins
- [ ] **`aria-live="polite"`** announces answer submissions
- [ ] **`aria-live="polite"`** announces score updates
- [ ] **All buttons** have clear labels
- [ ] **All inputs** have associated labels
- [ ] **Form validation** is accessible
- [ ] **Keyboard navigation** works properly
- [ ] **Focus indicators** are visible
- [ ] **Screen reader** can navigate the interface
- [ ] **Real-time updates** are announced

## 🎮 **Test URLs**

- **Lobby**: `http://localhost:3000/lobby`
- **Test Game**: `http://localhost:3000/game/test-match-123`
- **Custom Game**: `http://localhost:3000/game/[any-match-id]`

## 🚀 **Quick Test Steps**

1. **Start server**: `npm run dev`
2. **Open lobby**: Login and go to `/lobby`
3. **Click "Test Game"** button
4. **Open second tab** with same match ID
5. **Submit answers** and listen for announcements
6. **Verify scoreboard** updates in real-time

## 📱 **Mobile Accessibility**

- **Touch targets** are minimum 44px
- **High contrast** mode support
- **Zoom support** up to 200%
- **VoiceOver/TalkBack** compatible

## 🎯 **Expected Console Output**

```
🔌 User connected: [socket-id]
🎮 User [socket-id] joined match: test-match-123
📝 Answer received from [user-id] in match test-match-123: 4
🔌 User disconnected: [socket-id]
```

## 🔧 **Troubleshooting**

### **No WebSocket Connection**
- Check server is running with `npm run dev`
- Verify console shows "Socket.IO server ready"
- Check browser console for connection errors

### **No Screen Reader Announcements**
- Verify `aria-live="polite"` is present
- Check that `announcement` state is updating
- Ensure screen reader is enabled

### **Real-time Updates Not Working**
- Check WebSocket connection status
- Verify both players are in same match room
- Check browser console for socket errors

