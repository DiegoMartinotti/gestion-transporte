import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Container,
  Center,
  Stack,
  Anchor,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLogin } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../services/authService';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : null),
    },
  });

  const handleSubmit = async (values: LoginCredentials) => {
    setIsLoading(true);
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xs" py={80}>
      <Paper p="xl" withBorder shadow="md" radius="md" pos="relative">
        <LoadingOverlay visible={isLoading} />
        
        <Center mb="xl">
          <Stack align="center" gap="sm">
            <IconLogin size={50} color="var(--mantine-color-blue-6)" />
            <Title order={1} size="h2">
              Iniciar Sesión
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Accede a tu cuenta del Sistema de Gestión de Transporte
            </Text>
          </Stack>
        </Center>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="tu@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              required
              {...form.getInputProps('password')}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              mt="lg"
              loading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          ¿No tienes una cuenta?{' '}
          <Anchor component={Link} to="/register" size="sm">
            Regístrate aquí
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default LoginPage;