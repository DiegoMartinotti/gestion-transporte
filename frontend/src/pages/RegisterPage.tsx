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
import { IconUserPlus } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../services/authService';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterData>({
    initialValues: {
      nombre: '',
      email: '',
      password: '',
    },
    validate: {
      nombre: (value) => (value.length < 2 ? 'El nombre debe tener al menos 2 caracteres' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : null),
    },
  });

  const handleSubmit = async (values: RegisterData) => {
    setIsLoading(true);
    try {
      await register(values);
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
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
            <IconUserPlus size={50} color="var(--mantine-color-green-6)" />
            <Title order={1} size="h2">
              Crear Cuenta
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Únete al Sistema de Gestión de Transporte
            </Text>
          </Stack>
        </Center>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nombre completo"
              placeholder="Tu nombre"
              required
              {...form.getInputProps('nombre')}
            />

            <TextInput
              label="Email"
              placeholder="tu@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Al menos 8 caracteres"
              required
              {...form.getInputProps('password')}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              mt="lg"
              loading={isLoading}
              color="green"
            >
              Crear Cuenta
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          ¿Ya tienes una cuenta?{' '}
          <Anchor component={Link} to="/login" size="sm">
            Inicia sesión aquí
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default RegisterPage;