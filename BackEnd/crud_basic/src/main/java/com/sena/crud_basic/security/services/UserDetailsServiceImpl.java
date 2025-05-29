package com.sena.crud_basic.security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sena.crud_basic.model.UserDTO;
import com.sena.crud_basic.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    private static final int MAX_FAILED_ATTEMPTS = 3;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDTO user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));

        return UserDetailsImpl.build(user);
    }
    
// En UserDetailsServiceImpl
public void increaseFailedAttempts(UserDTO user) {
    int newFailedAttempts = user.getFailedAttempt() + 1;
    userRepository.updateFailedAttempts(newFailedAttempts, user.getUsername());
    
    // Bloquear cuenta después de MAX_FAILED_ATTEMPTS
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockUser(user);
    }
}
    
    public void resetFailedAttempts(String username) {
        userRepository.updateFailedAttempts(0, username);
    }
    
    public void lockUser(UserDTO user) {
        userRepository.updateAccountLockStatus(false, user.getUsername());
    }
    
    public void unlockUser(String username) {
        userRepository.updateFailedAttempts(0, username);
        userRepository.updateAccountLockStatus(true, username);
    }
}