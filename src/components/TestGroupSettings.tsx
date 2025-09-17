import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

interface TestGroupSettings {
  allowPublicJoin: boolean;
  requireApproval: boolean;
  maxMembers: number;
  notificationEmail: string;
  // Notification preferences
  notifyOnMemberJoin: boolean;
  notifyOnMemberLeave: boolean;
  notifyOnTestStart: boolean;
  notifyOnTestEnd: boolean;
  notifyOnFeedback: boolean;
  receiveWeeklyDigest: boolean;
  receiveMonthlyReport: boolean;
  digestDay: string;
  digestTime: string;
}

interface TestGroupSettingsProps {
  settings: TestGroupSettings;
  onSave: (settings: TestGroupSettings) => Promise<void>;
}

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function TestGroupSettings({ settings: initialSettings, onSave }: TestGroupSettingsProps) {
  const [settings, setSettings] = useState<TestGroupSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof TestGroupSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(settings);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">
                General Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowPublicJoin}
                    onChange={handleChange('allowPublicJoin')}
                  />
                }
                label="Allow Public Join"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireApproval}
                    onChange={handleChange('requireApproval')}
                  />
                }
                label="Require Approval for New Members"
              />

              <TextField
                label="Maximum Members"
                type="number"
                value={settings.maxMembers}
                onChange={handleChange('maxMembers')}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">
                Notification Settings
              </Typography>

              <TextField
                label="Notification Email"
                type="email"
                value={settings.notificationEmail}
                onChange={handleChange('notificationEmail')}
                fullWidth
                helperText="Email address for group notifications"
              />

              <Divider />

              <Typography variant="subtitle1">
                Event Notifications
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnMemberJoin}
                    onChange={handleChange('notifyOnMemberJoin')}
                  />
                }
                label="Notify when members join"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnMemberLeave}
                    onChange={handleChange('notifyOnMemberLeave')}
                  />
                }
                label="Notify when members leave"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnTestStart}
                    onChange={handleChange('notifyOnTestStart')}
                  />
                }
                label="Notify when test sessions start"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnTestEnd}
                    onChange={handleChange('notifyOnTestEnd')}
                  />
                }
                label="Notify when test sessions end"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnFeedback}
                    onChange={handleChange('notifyOnFeedback')}
                  />
                }
                label="Notify on new feedback"
              />

              <Divider />

              <Typography variant="subtitle1">
                Digest Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.receiveWeeklyDigest}
                    onChange={handleChange('receiveWeeklyDigest')}
                  />
                }
                label="Receive weekly digest"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.receiveMonthlyReport}
                    onChange={handleChange('receiveMonthlyReport')}
                  />
                }
                label="Receive monthly report"
              />

              {(settings.receiveWeeklyDigest || settings.receiveMonthlyReport) && (
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Digest Day</InputLabel>
                    <Select
                      value={settings.digestDay}
                      label="Digest Day"
                      onChange={(e) => handleChange('digestDay')({ target: { value: e.target.value } } as any)}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Digest Time"
                    type="time"
                    value={settings.digestTime}
                    onChange={handleChange('digestTime')}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300, // 5 min
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {saveError && (
          <Alert severity="error">
            {saveError}
          </Alert>
        )}

        {saveSuccess && (
          <Alert severity="success">
            Settings saved successfully!
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Stack>
    </Box>
  );
} 