import React, { useRef, useState } from 'react';
import { Text, Alert } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors, spacing, typography } from '../theme';
export default function ResetPasswordScreen() {
  const { updatePassword,signOut }=useData();
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const pending=useRef(false);
  async function save() {
    if(pending.current) return;
    if(password.length<8 || password!==confirm) {setError('Use pelo menos 8 caracteres e repita a mesma senha.');return;}
    pending.current=true;setBusy(true);setError('');
    try {await updatePassword(password);Alert.alert('Senha atualizada','Sua nova senha foi salva.');}
    catch(e){setError(errorMessage(e));}
    finally {pending.current=false;setBusy(false);}
  }
  return <Screen scroll>
    <Text style={{...typography.h2,color:colors.text,marginVertical:spacing.lg}}>Defina sua nova senha</Text>
    <Input label="Nova senha" value={password} onChangeText={setPassword} secureTextEntry editable={!busy}/>
    <Input label="Repita a senha" value={confirm} onChangeText={setConfirm} secureTextEntry editable={!busy} error={error}/>
    <Button title="Salvar nova senha" loading={busy} onPress={save}/>
    <Button title="Cancelar e sair" disabled={busy} variant="ghost" onPress={()=>signOut().catch(e=>setError(errorMessage(e)))}/>
  </Screen>;
}
