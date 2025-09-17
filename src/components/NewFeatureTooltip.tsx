import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
} from '@mui/material';
import { Close as CloseIcon, LightbulbOutlined as LightbulbIcon } from '@mui/icons-material';

export interface TooltipStep {
  id: string;
  title: string;
  description: string;
  elementId: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface NewFeatureTooltipProps {
  steps: TooltipStep[];
  onComplete?: () => void;
}

const LOCAL_STORAGE_KEY = 'feature_tooltips_seen';

export default function NewFeatureTooltip({ steps, onComplete }: NewFeatureTooltipProps) {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seenFeatures = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    const unseenSteps = steps.filter(step => !seenFeatures[step.id]);
    
    if (unseenSteps.length > 0) {
      setActiveStep(0);
      setOpen(true);
    }
  }, [steps]);

  const handleNext = () => {
    const seenFeatures = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    seenFeatures[steps[activeStep].id] = true;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seenFeatures));

    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      setOpen(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    const seenFeatures = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    steps.forEach(step => {
      seenFeatures[step.id] = true;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seenFeatures));
    
    setOpen(false);
    onComplete?.();
  };

  if (activeStep === -1 || !open) return null;

  const currentStep = steps[activeStep];
  const targetElement = document.getElementById(currentStep.elementId);

  if (!targetElement) return null;

  return (
    <Tooltip
      open={open}
      placement={currentStep.placement || 'bottom'}
      arrow
      PopperProps={{
        anchorEl: targetElement,
      }}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            maxWidth: 'none',
          },
        },
      }}
      title={
        <Paper
          elevation={4}
          sx={{
            p: 2,
            maxWidth: 320,
            bgcolor: '#ffffff',
            position: 'relative',
          }}
        >
          <IconButton
            size="small"
            onClick={handleSkip}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LightbulbIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="subtitle1" color="primary">
              {currentStep.title}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            {currentStep.description}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={handleSkip}>
              Skip all
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleNext}
            >
              {activeStep === steps.length - 1 ? 'Got it' : 'Next'}
            </Button>
          </Box>
        </Paper>
      }
    >
      <div />
    </Tooltip>
  );
} 