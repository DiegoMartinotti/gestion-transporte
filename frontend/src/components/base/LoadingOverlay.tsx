import { LoadingOverlay as MantineLoadingOverlay, LoadingOverlayProps, Box } from '@mantine/core';

interface CustomLoadingOverlayProps extends Omit<LoadingOverlayProps, 'visible'> {
  loading: boolean;
  children: React.ReactNode;
}

export default function LoadingOverlay({ 
  loading, 
  children, 
  loaderProps = { type: 'bars' },
  overlayProps = { backgroundOpacity: 0.3, blur: 2 },
  ...rest 
}: CustomLoadingOverlayProps) {
  return (
    <Box style={{ position: 'relative' }}>
      <MantineLoadingOverlay 
        visible={loading} 
        loaderProps={loaderProps}
        overlayProps={overlayProps}
        {...rest}
      />
      {children}
    </Box>
  );
}